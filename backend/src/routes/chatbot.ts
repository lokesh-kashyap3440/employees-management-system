import { Router } from 'express';
import type { Response } from 'express';
import { getDb } from '../db.ts';
import { authenticateToken } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';

const router = Router();

/**
 * @swagger
 * /chatbot/query:
 *   post:
 *     summary: Query employees using an LLM (Ollama or Cloud)
 *     tags: [Chatbot]
 *     security:
 *       - bearerAuth: []
 */
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
      You are a Secure HR Assistant. Answer queries based ONLY on the provided employee data.
      
      DATA (JSON):
      ${JSON.stringify(employees)}

      RESPONSE FORMAT:
      You MUST respond with a valid JSON object only. No preamble or explanation.
      Format:
      {
        "message": "A professional text summary of the answer.",
        "matching_employee_ids": ["array of _id strings for employees that match the query"]
      }

      RULES:
      1. If the query asks for "Who earns > 100k", include ONLY those IDs.
      2. If nobody matches, return an empty array for matching_employee_ids.
      3. Perform calculations if needed (averages, totals).
      4. Today's date is ${new Date().toLocaleDateString()}.
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
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "{}";
    
    // Some models might wrap JSON in markdown blocks
    if (content.includes('```json')) {
        content = content.split('```json')[1].split('```')[0].trim();
    } else if (content.includes('```')) {
        content = content.split('```')[1].split('```')[0].trim();
    }

    const result = JSON.parse(content);
    const botMessage = result.message || "I couldn't process that.";
    const matchingIds = result.matching_employee_ids || [];

    // Filter original employees list to only those the LLM identified
    const filteredEmployees = employees.filter(emp => 
        matchingIds.includes(emp._id.toString())
    );

    res.json({ 
      results: filteredEmployees, 
      message: botMessage 
    });

  } catch (error: any) {
    console.error('LLM Chatbot error:', error.message);
    res.status(500).json({ error: 'Failed to process chat query' });
  }
});

export default router;