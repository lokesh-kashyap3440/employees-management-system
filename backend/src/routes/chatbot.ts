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

    // Simplified data format for easier LLM parsing
    const employeeContext = employees.map(e => 
        `ID: ${e._id.toString()} | Name: ${e.name} | Salary: ${e.salary} | Dept: ${e.department} | Role: ${e.position}`
    ).join('\n');

    const systemPrompt = `
      You are a Secure HR Assistant. You have access to the following employee records:
      
      ${employeeContext}

      TASK:
      Answer the user's query using the data above.
      
      RESPONSE FORMAT (MUST BE VALID JSON):
      {
        "message": "Your text answer here.",
        "matching_employee_ids": ["id1", "id2"]
      }

      RULES:
      1. Return ONLY the JSON object. No markdown, no commentary.
      2. If the user asks for specific filters (salary, dept), include ONLY matching IDs in matching_employee_ids.
      3. If the query is a general question (e.g. average salary), matching_employee_ids can be empty unless they specifically ask "who".
      4. Current Date: ${new Date().toLocaleDateString()}
    `;

    console.log('🤖 Sending query to LLM:', query);

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
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let rawContent = data.choices?.[0]?.message?.content || "{}";
    
    console.log('📄 Raw LLM Response:', rawContent);

    // Robust JSON extraction
    let jsonContent = rawContent;
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonContent = jsonMatch[0];
    }

    try {
        const result = JSON.parse(jsonContent);
        const botMessage = result.message || "I found some results for you.";
        const matchingIds = Array.isArray(result.matching_employee_ids) ? result.matching_employee_ids : [];

        // Filter original employees list to only those the LLM identified
        const filteredEmployees = employees.filter(emp => 
            matchingIds.includes(emp._id.toString())
        );

        console.log(`✅ Filtered to ${filteredEmployees.length} employees`);

        res.json({
          results: filteredEmployees, 
          message: botMessage 
        });
    } catch (parseError) {
        console.error('❌ Failed to parse LLM JSON:', jsonContent);
        // Fallback for non-JSON response
        res.json({
            results: [],
            message: rawContent
        });
    }

  } catch (error: any) {
    console.error('LLM Chatbot error:', error.message);
    res.status(500).json({ error: 'Failed to process chat query' });
  }
});

export default router;
