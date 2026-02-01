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
    let sort: any = { updatedAt: -1 };
    let limit = 0;

    // Role-based security: users only see their own, admins see all
    if (req.user?.role !== 'admin') {
      filter.createdBy = req.user?.username;
    }

    const q = query.toLowerCase().trim();

    // 1. Superlatives (Highest/Lowest)
    const isHighest = /highest|most|max|maximum|richest/i.test(q) && /salary|earn/i.test(q);
    const isLowest = /lowest|least|min|minimum|poorest/i.test(q) && /salary|earn/i.test(q);

    // 2. Range Queries
    const rangeMatch = q.match(/between\s+(\d+)\s+and\s+(\d+)/i) || q.match(/(\d+)\s+to\s+(\d+)/i);

    // 3. Attribute Extraction (Specific field request)
    const wantsDept = /department|dept|unit|team/i.test(q);
    const wantsSalary = /salary|earn|pay|income|compensation/i.test(q);
    const wantsPosition = /position|job|role|title|work\s+as/i.test(q);

    // 4. Name/Identity Extraction
    // Try to find names in patterns like "is [Name] ...", "[Name] earns", "about [Name]"
    const patterns = [
        /does\s+(.*?)\s+belongs?\s+to/i,
        /is\s+(.*?)\s+in/i,
        /about\s+(.*)/i,
        /is\s+(.*?)\s+earning/i,
        /is\s+(.*?)\s+salary/i,
        /salary\s+of\s+(.*)/i,
        /how\s+much\s+(?:is\s+)?(.*?)\s+(?:earning|earns|paid)/i,
        /who\s+is\s+(.*)/i
    ];

    let nameFromPattern = null;
    for (const pattern of patterns) {
        const match = q.match(pattern);
        if (match && match[1]) {
            // Clean noise from extracted name
            nameFromPattern = match[1].replace(/['']s|his|her|the/g, '').trim();
            if (nameFromPattern.length > 1) break;
        }
    }

    const nameMatch = nameFromPattern || q.match(/named\s+(.*)/i) || q.match(/name\s+is\s+(.*)/i) || q.match(/name\s*:\s*(.*)/i);
    
    // 5. Simple Comparisons
    const salaryGt = q.match(/earns?\s+more\s+than\s+(\d+)/i) || q.match(/salary\s*>\s*(\d+)/i) || q.match(/above\s+(\d+)/i);
    const salaryLt = q.match(/earns?\s+less\s+than\s+(\d+)/i) || q.match(/salary\s*<\s*(\d+)/i) || q.match(/below\s+(\d+)/i);

    // 6. Identity/Attribute Matches
    const deptMatch = q.match(/in\s+(?:the\s+)?(.*)\s+department/i) || q.match(/department\s+is\s+(.*)/i) || q.match(/dept\s*:\s*(.*)/i);
    const posMatch = q.match(/position\s+is\s+(.*)/i) || q.match(/position\s*:\s*(.*)/i);

    // Apply Logic
    if (isHighest) {
      sort = { salary: -1, _id: 1 };
      limit = 1;
    } else if (isLowest) {
      sort = { salary: 1, _id: 1 };
      limit = 1;
    }

    if (rangeMatch) {
      const min = Math.min(Number(rangeMatch[1]), Number(rangeMatch[2]));
      const max = Math.max(Number(rangeMatch[1]), Number(rangeMatch[2]));
      filter.salary = { $gte: min, $lte: max };
    } else {
      if (salaryGt) filter.salary = { ...filter.salary, $gt: Number(salaryGt[1]) };
      if (salaryLt) filter.salary = { ...filter.salary, $lt: Number(salaryLt[1]) };
    }

    if (deptMatch) filter.department = new RegExp(deptMatch[1].trim(), 'i');
    if (nameMatch) {
        const nameVal = typeof nameMatch === 'string' ? nameMatch : (nameMatch[1] || nameMatch[0]);
        filter.name = new RegExp(nameVal.trim(), 'i');
    }
    if (posMatch) filter.position = new RegExp(posMatch[1].trim(), 'i');

    // Fallback: If no specific filters matched (except role-based), search broadly
    let finalFilter = filter;
    const baseFilterCount = req.user?.role === 'admin' ? 0 : 1;
    
    if (Object.keys(filter).length === baseFilterCount && !isHighest && !isLowest) {
        // Broad/Fuzzy search logic
        const noiseWords = ['does', 'belongs', 'which', 'what', 'how', 'much', 'is', 'are', 'the', 'earning', 'earns', 'salary', 'belongs', 'to', 'about', 'who'];
        const searchTerms = q.split(/\s+/).filter(word => word.length > 2 && !noiseWords.includes(word));
        
        if (searchTerms.length > 0) {
            const termFilters = searchTerms.map(term => {
                const searchRegex = new RegExp(term, 'i');
                return {
                    $or: [
                        { name: searchRegex },
                        { department: searchRegex },
                        { position: searchRegex }
                    ]
                };
            });
            
            const broadSearch = termFilters.length === 1 ? termFilters[0] : { $and: termFilters };
            
            if (req.user?.role === 'admin') {
                finalFilter = broadSearch;
            } else {
                finalFilter = { ...broadSearch, createdBy: req.user?.username };
            }
        } else {
            // Very short or pure noise query, try direct regex on original string if it's not all noise
            const searchRegex = new RegExp(q, 'i');
            const simpleBroad = [
                { name: searchRegex },
                { department: searchRegex },
                { position: searchRegex }
            ];
            if (req.user?.role === 'admin') {
                finalFilter = { $or: simpleBroad };
            } else {
                finalFilter = { createdBy: req.user?.username, $or: simpleBroad };
            }
        }
    }

    let cursor = db.collection('employees').find(finalFilter).sort(sort);
    if (limit > 0) cursor = cursor.limit(limit);
    
    const employees = await cursor.toArray();
    
    let message = `I found ${employees.length} employees matching your query.`;
    
    if (isHighest && employees.length > 0) {
        message = `The employee with the highest salary is ${employees[0].name}.`;
    } else if (isLowest && employees.length > 0) {
        message = `The employee with the lowest salary is ${employees[0].name}.`;
    } else if (employees.length === 1) {
        const emp = employees[0];
        if (wantsDept) message = `${emp.name} is in the ${emp.department || 'General'} department.`;
        else if (wantsSalary) message = `${emp.name}'s salary is $${emp.salary?.toLocaleString() || 'N/A'}.`;
        else if (wantsPosition) message = `${emp.name} works as a ${emp.position || 'Staff'}.`;
        else message = `I found ${emp.name}. They work as a ${emp.position} in ${emp.department}.`;
    }
    
    if (employees.length === 0) message = "I couldn't find any employees matching that description.";

    res.json({ results: employees, message });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chat query' });
  }
});

export default router;