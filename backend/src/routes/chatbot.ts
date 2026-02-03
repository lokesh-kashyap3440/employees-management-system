import { Router } from 'express';
import type { Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.ts';
import { authenticateToken } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { broadcastUpdate } from '../socket.ts';
import { deletePattern, deleteCache } from '../redis.ts';
import type { ChatSession, ChatMessage } from '../models/chatSession.ts';

const router = Router();

// GET /chatbot/history - Retrieve past messages for the current user
router.get('/history', authenticateToken as any, async (req: AuthRequest, res: Response) => {
    try {
        const db = getDb();
        const username = req.user?.username;
        
        console.log(`📜 Fetching history for user: ${username}`); // Debug log

        const session = await db.collection<ChatSession>('chat_sessions').findOne({ userId: username });
        
        if (!session) {
            console.log(`📜 No session found for: ${username}`);
            return res.json({ messages: [] });
        }

        console.log(`📜 Found ${session.messages.length} messages for: ${username}`);

        // Transform for frontend (skip system prompts if any)
        const messages = session.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                id: m.timestamp.getTime().toString(),
                text: m.content,
                sender: m.role === 'user' ? 'user' : 'bot'
            }));

        res.json({ messages });
    } catch (error) {
        console.error('History Fetch Error:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// POST /chatbot/query - Process new message
router.post('/query', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  const username = req.user?.username;
  const db = getDb();

  try {
    // 1. Get or Create Session
    let session = await db.collection<ChatSession>('chat_sessions').findOne({ userId: username });
    if (!session) {
        session = {
            userId: username!,
            messages: [],
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const result = await db.collection<ChatSession>('chat_sessions').insertOne(session);
        session._id = result.insertedId;
    }

    // 2. Fetch Employee Data Context
    const filter: any = {};
    if (req.user?.role !== 'admin') {
      filter.createdBy = username;
    }

    const employees = await db.collection('employees')
      .find(filter)
      .project({ name: 1, position: 1, department: 1, salary: 1, createdBy: 1 })
      .toArray();

    const systemPrompt = `
      You are an intelligent HR Assistant capable of performing actions.
      
      CRITICAL INSTRUCTION: 
      - Always use the "EXISTING DATA" below as the source of truth. 
      - If conversation history contradicts "EXISTING DATA", ignore the history.
      - If the user asks for a calculation (sum, average), perform it using "EXISTING DATA".
      
      CURRENT USER CONTEXT:
      - Role: ${req.user?.role}
      - Username: ${username}
      
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

    // 3. Prepare Context Window (Last 10 messages)
    // We add the NEW query temporarily to the prompt context
    const contextMessages = session.messages.slice(-10).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user', // Ensure strict mapping
        content: m.content
    }));

    const apiUrl = process.env.LLM_API_URL || 'http://localhost:11434/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'qwen2.5-coder:3b';

    // 4. Call LLM
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
          ...contextMessages,
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
    
    let result;
    try {
        // Find the first valid JSON object in the string
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
        } else {
            throw new Error('No JSON found');
        }
    } catch (e) {
        console.warn('⚠️ LLM returned non-JSON. Falling back to text.', content);
        result = { 
            intent: 'query', 
            message: content // Use the raw text as the answer
        };
    }

    // 5. Execute Actions & Formulate Final Response
    let finalMessage = result.message || "Done.";
    
    if (result.intent === 'create') {
        const newEmp = {
            ...result.data,
            createdBy: username,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await db.collection('employees').insertOne(newEmp);
        await deletePattern('employees_list:*');
        broadcastUpdate('CREATE');
        finalMessage = `✅ Successfully created employee: ${newEmp.name}`;
    } else if (result.intent === 'update') {
        if (result.target_id) {
            await db.collection('employees').updateOne(
                { _id: new ObjectId(result.target_id) },
                { $set: { ...result.update_fields, updatedAt: new Date() } }
            );
            await deleteCache(`employee:${result.target_id}`);
            await deletePattern('employees_list:*');
            broadcastUpdate('UPDATE');
            finalMessage = `✅ Updated details for employee ID ${result.target_id}.`;
        }
    } else if (result.intent === 'delete') {
        if (result.target_id) {
            await db.collection('employees').deleteOne({ _id: new ObjectId(result.target_id) });
            await deleteCache(`employee:${result.target_id}`);
            await deletePattern('employees_list:*');
            broadcastUpdate('DELETE');
            finalMessage = `🗑️ Deleted employee ID ${result.target_id}`;
        }
    }

    // 6. Save to DB (Persistence)
    const newMessages: ChatMessage[] = [
        { role: 'user', content: query, timestamp: new Date() },
        { role: 'assistant', content: finalMessage, timestamp: new Date() }
    ];

    await db.collection('chat_sessions').updateOne(
        { userId: username },
        { 
            $push: { messages: { $each: newMessages } },
            $set: { updatedAt: new Date() }
        }
    );

    // 7. Response
    // For queries, we filter results based on IDs provided by LLM
    const matchingIds = Array.isArray(result.matching_ids) ? result.matching_ids : [];
    const filtered = employees.filter(emp => matchingIds.includes(emp._id.toString()));

    res.json({ 
        results: filtered, 
        message: finalMessage 
    });

  } catch (error: any) {
    console.error('Chatbot Action Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

export default router;