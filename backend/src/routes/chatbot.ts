import { Router } from 'express';
import type { Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.ts';
import { authenticateToken } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { broadcastUpdate } from '../socket.ts';
import { deletePattern, deleteCache } from '../redis.ts';

const router = Router();

router.post('/query', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const db = getDb();
    // 1. Fetch simplified context for the LLM
    const filter: any = {};
    if (req.user?.role !== 'admin') {
      filter.createdBy = req.user?.username;
    }

    const employees = await db.collection('employees')
      .find(filter)
      .project({ name: 1, position: 1, department: 1, salary: 1, createdBy: 1 })
      .toArray();

    const apiUrl = process.env.LLM_API_URL || 'http://localhost:11434/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'qwen2.5-coder:3b';

    const systemPrompt = `
      You are an intelligent HR Assistant capable of performing actions.
      
      CURRENT USER CONTEXT:
      - Role: ${req.user?.role}
      - Username: ${req.user?.username}
      
      EXISTING DATA (Use IDs from here for updates/deletes):
      ${JSON.stringify(employees.map(e => ({ id: e._id.toString(), name: e.name, ...e })))}

      YOUR GOAL:
      Classify the user's intent as one of: "query", "create", "update", "delete".

      RESPONSE FORMAT (JSON ONLY):
      
      1. FOR QUERIES (Searching/Calculating):
      {
        "intent": "query",
        "message": "Answer to the question.",
        "matching_ids": ["id1", "id2"] // Only for filtering lists
      }

      2. FOR CREATE (e.g. "Hire John Doe as Dev"):
      {
        "intent": "create",
        "data": { "name": "String", "position": "String", "department": "String", "salary": "String" }
      }

      3. FOR UPDATE (e.g. "Give John a raise to 80k"):
      {
        "intent": "update",
        "target_name": "Name to find ID", 
        "target_id": "Exact ID from DATA if found",
        "update_fields": { "salary": "80000" } 
      }

      4. FOR DELETE (e.g. "Fire John"):
      {
        "intent": "delete",
        "target_id": "Exact ID from DATA"
      }
    `;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.LLM_API_KEY && { 'Authorization': `Bearer ${process.env.LLM_API_KEY}` })
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        stream: false,
        temperature: 0,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`LLM Error: ${response.status}`);

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json|```/g, '').trim();
    
    console.log('🤖 LLM Raw Output:', content);

    let result;
    try {
        result = JSON.parse(content);
    } catch (e) {
        return res.json({ message: "I understood that, but I'm having trouble formatting the action." });
    }

    // --- ACTION HANDLERS ---

    if (result.intent === 'create') {
        const newEmp = {
            ...result.data,
            createdBy: req.user?.username,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await db.collection('employees').insertOne(newEmp);
        
        // Cache Invalidation
        await deletePattern('employees_list:*');
        broadcastUpdate('CREATE');
        
        return res.json({ message: `✅ Successfully created employee: ${newEmp.name}` });
    }

    if (result.intent === 'update') {
        if (!result.target_id) return res.json({ message: "I couldn't find exactly which employee to update." });
        
        // Security Check
        const target = employees.find(e => e._id.toString() === result.target_id);
        if (!target) return res.json({ message: "Employee not found or access denied." });

        await db.collection('employees').updateOne(
            { _id: new ObjectId(result.target_id) },
            { $set: { ...result.update_fields, updatedAt: new Date() } }
        );

        await deleteCache(`employee:${result.target_id}`);
        await deletePattern('employees_list:*');
        broadcastUpdate('UPDATE');

        return res.json({ message: `✅ Updated details for ${target.name}.` });
    }

    if (result.intent === 'delete') {
        if (!result.target_id) return res.json({ message: "I couldn't identify who to delete." });

        const target = employees.find(e => e._id.toString() === result.target_id);
        if (!target) return res.json({ message: "Employee not found or access denied." });

        await db.collection('employees').deleteOne({ _id: new ObjectId(result.target_id) });

        await deleteCache(`employee:${result.target_id}`);
        await deletePattern('employees_list:*');
        broadcastUpdate('DELETE');

        return res.json({ message: `🗑️ Deleted employee: ${target.name}` });
    }

    // Default: Query
    const matchingIds = Array.isArray(result.matching_ids) ? result.matching_ids : [];
    const filtered = employees.filter(emp => matchingIds.includes(emp._id.toString()));
    
    res.json({ 
        results: filtered, 
        message: result.message || "Here is the data." 
    });

  } catch (error: any) {
    console.error('Chatbot Action Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

export default router;
