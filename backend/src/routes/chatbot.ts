import { Router } from 'express';
import type { Response } from 'express';
import { getDb } from '../db.ts';
import { authenticateToken } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';

const router = Router();

router.post('/query', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const db = getDb();
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
      You are an HR Data Analyst. You have access to the employee list provided below.
      
      EMPLOYEE DATA:
      ${JSON.stringify(employees.map(e => ({ id: e._id.toString(), name: e.name, salary: e.salary, dept: e.department, role: e.position })))}

      TASK:
      Analyze the user's query and the data. 
      Return a JSON response identifying ONLY the employees that strictly match the criteria.

      CRITICAL RULES:
      1. For "Who earns more than X", "matching_employee_ids" MUST only contain IDs where salary > X.
      2. For "How many employees", "matching_employee_ids" should contain ALL relevant IDs.
      3. For specific name/dept searches, only include the matches.
      4. If the question is a general calculation (e.g. "What is the average salary?"), return the answer in "message" and an empty array for "matching_employee_ids".
      5. NEVER return IDs that don't match the user's specific filter.

      RESPONSE FORMAT (JSON ONLY):
      {
        "message": "Your professional response string.",
        "matching_employee_ids": ["id1", "id2"]
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
        temperature: 0, // Set to 0 for maximum strictness
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";
    
    // Clean markdown if present
    content = content.replace(/```json|```/g, '').trim();

    try {
        const result = JSON.parse(content);
        const botMessage = result.message || "I've processed your query.";
        const matchingIds = Array.isArray(result.matching_employee_ids) ? result.matching_employee_ids : [];

        // Filter original employees list to only those the LLM identified
        const filteredEmployees = employees.filter(emp => 
            matchingIds.includes(emp._id.toString())
        );

        res.json({ 
          results: filteredEmployees, 
          message: botMessage 
        });
    } catch (parseError) {
        console.error('❌ JSON Parse Error. Raw content:', content);
        res.json({
            results: [],
            message: content // Return raw content as fallback
        });
    }

  } catch (error: any) {
    console.error('LLM Chatbot error:', error.message);
    res.status(500).json({ error: 'Failed to process chat query' });
  }
});

export default router;