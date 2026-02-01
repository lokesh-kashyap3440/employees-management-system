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
 *     summary: Query employees using natural language
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
 *     responses:
 *       200:
 *         description: Query results
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

    // Extraction logic
    const salaryGt = query.match(/earns?\s+more\s+than\s+(\d+)/i) || query.match(/salary\s*>\s*(\d+)/i);
    const salaryLt = query.match(/earns?\s+less\s+than\s+(\d+)/i) || query.match(/salary\s*<\s*(\d+)/i);
    const deptMatch = query.match(/in\s+(?:the\s+)?(.*)\s+department/i) || query.match(/department\s+is\s+(.*)/i) || query.match(/dept\s*:\s*(.*)/i);
    const nameMatch = query.match(/named\s+(.*)/i) || query.match(/name\s+is\s+(.*)/i) || query.match(/name\s*:\s*(.*)/i);
    const posMatch = query.match(/position\s+is\s+(.*)/i) || query.match(/position\s*:\s*(.*)/i);

    if (salaryGt) filter.salary = { ...filter.salary, $gt: Number(salaryGt[1]) };
    if (salaryLt) filter.salary = { ...filter.salary, $lt: Number(salaryLt[1]) };
    if (deptMatch) filter.department = new RegExp(deptMatch[1].trim(), 'i');
    if (nameMatch) filter.name = new RegExp(nameMatch[1].trim(), 'i');
    if (posMatch) filter.position = new RegExp(posMatch[1].trim(), 'i');

    // Fallback: If no patterns matched, search broadly
    let finalFilter = filter;
    const baseFilterCount = req.user?.role === 'admin' ? 0 : 1;
    
    if (Object.keys(filter).length === baseFilterCount) {
        const searchRegex = new RegExp(query.trim(), 'i');
        const broadSearch = [
            { name: searchRegex },
            { department: searchRegex },
            { position: searchRegex }
        ];
        
        if (req.user?.role === 'admin') {
            finalFilter = { $or: broadSearch };
        } else {
            finalFilter = { createdBy: req.user?.username, $or: broadSearch };
        }
    }

    const employees = await db.collection('employees').find(finalFilter).toArray();
    
    let message = `I found ${employees.length} employees matching your query.`;
    if (employees.length === 0) message = "I couldn't find any employees matching that description.";

    res.json({ results: employees, message });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chat query' });
  }
});

export default router;
