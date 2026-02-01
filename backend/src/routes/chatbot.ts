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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 */
router.post('/query', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const db = getDb();
    const filter: any = {};

    // Role-based security: users only see their own, admins see all
    if (req.user?.role !== 'admin') {
      filter.createdBy = req.user?.username;
    }

    // 1. Fetch authorized employee data to provide as context
    // We only select necessary fields to save context window tokens
    const employees = await db.collection('employees')
      .find(filter)
      .project({ name: 1, position: 1, department: 1, salary: 1, createdBy: 1 })
      .toArray();

    // 2. Prepare LLM Request
    const provider = process.env.LLM_PROVIDER || 'ollama'; // 'ollama' or 'openai' (for gpt-oss)
    const apiUrl = process.env.LLM_API_URL || 'http://localhost:11434/v1/chat/completions';
    const model = process.env.LLM_MODEL || 'qwen2.5-coder:3b';

    const systemPrompt = `
      You are a Secure HR Assistant for the Employee Management System.
      Your task is to answer user queries based ONLY on the provided employee data.
      
      DATA (JSON):
      ${JSON.stringify(employees)}

      RULES:
      1. If the query asks for someone not in the data, say you couldn't find them.
      2. If the query asks for calculations (e.g., total salary, average), perform them accurately.
      3. Keep answers concise and professional.
      4. Do not mention the JSON format or technical details in your response.
      5. Today's date is ${new Date().toLocaleDateString()}.
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
        temperature: 0.1 // Low temperature for factual accuracy
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`LLM API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const botMessage = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Return results + the LLM generated message
    res.json({ 
      results: employees.slice(0, 5), // Return a few snippets for the UI cards
      message: botMessage 
    });

  } catch (error: any) {
    console.error('LLM Chatbot error:', error.message);
    res.status(500).json({ error: 'Failed to process chat query with LLM' });
  }
});

export default router;
