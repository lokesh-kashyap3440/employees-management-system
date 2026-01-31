import { Router } from 'express';
import type { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db.ts';
import type { Employee } from '../models/employee.ts';
import { authenticateToken } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import { notifyAdmin } from '../socket.ts';

const router = Router();
const collectionName = 'employees';

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the employee
 *         name:
 *           type: string
 *           description: The name of the employee
 *         position:
 *           type: string
 *           description: The position of the employee
 *         department:
 *           type: string
 *           description: The department of the employee
 *         salary:
 *           type: number
 *           description: The salary of the employee
 *         createdBy:
 *           type: string
 *           description: The username of the creator
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date the employee was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date the employee was last updated
 *       example:
 *         name: John Doe
 *         position: Software Engineer
 *         department: Engineering
 *         salary: 75000
 */

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: The employees managing API
 */

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create a new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       201:
 *         description: The employee was successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insertedId:
 *                   type: string
 *       500:
 *         description: Some server error
 */
router.post('/', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const { name, position, department, salary } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const employee: Employee = {
      name,
      position,
      department,
      salary: salary ? Number(salary) : undefined,
      createdBy: req.user?.username,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await getDb()
      .collection(collectionName)
      .insertOne(employee as any);

    // Notify admin if the creator is not the admin themselves
    if (req.user?.role !== 'admin') {
      notifyAdmin({
        type: 'EMPLOYEE_ADDED',
        message: `New employee "${employee.name}" added by ${req.user?.username}`,
        data: employee,
        timestamp: new Date()
      });
    }

    res.status(201).json({ insertedId: result.insertedId });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Returns the list of all the employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The list of the employees
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Employee'
 *       500:
 *         description: Some server error
 */
router.get('/', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const query = req.user?.role === 'admin' ? {} : { createdBy: req.user?.username };
    const employees = await getDb()
      .collection(collectionName)
      .find(query)
      .sort({ updatedAt: -1, _id: -1 })
      .toArray();
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get the employee by id
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The employee id
 *     responses:
 *       200:
 *         description: The employee description by id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Employee'
 *       404:
 *         description: The employee was not found
 *       500:
 *         description: Some server error
 */
router.get('/:id', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const employee = await getDb()
      .collection(collectionName)
      .findOne({ _id: new ObjectId(id as string) });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    // Authorization check
    if (req.user?.role !== 'admin' && employee.createdBy !== req.user?.username) {
        return res.status(403).json({ error: 'Access denied' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update the employee by the id
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The employee id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Employee'
 *     responses:
 *       200:
 *         description: The employee was updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 modifiedCount:
 *                   type: number
 *       404:
 *         description: The employee was not found
 *       500:
 *         description: Some server error
 */
router.put('/:id', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();
    
    // Check authorization first
    if (req.user?.role !== 'admin') {
        const existingEmployee = await db.collection(collectionName).findOne({ _id: new ObjectId(id as string) });
        if (existingEmployee && existingEmployee.createdBy !== req.user?.username) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }

    const updates: Partial<Employee> = req.body;
    // Prevent updating createdBy manually
    delete updates.createdBy;
    // Update updatedAt timestamp
    updates.updatedAt = new Date();

    const result = await db
      .collection(collectionName)
      .updateOne({ _id: new ObjectId(id as string) }, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Notify admin
    if (req.user?.role !== 'admin') {
      notifyAdmin({
        type: 'EMPLOYEE_UPDATED',
        message: `Employee "${updates.name || id}" was updated by ${req.user?.username}`,
        data: { id, updates },
        timestamp: new Date()
      });
    }

    res.json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Remove the employee by id
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The employee id
 *     responses:
 *       200:
 *         description: The employee was deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount:
 *                   type: number
 *       404:
 *         description: The employee was not found
 *       500:
 *         description: Some server error
 */
router.delete('/:id', authenticateToken as any, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Check authorization first
    if (req.user?.role !== 'admin') {
        const existingEmployee = await db.collection(collectionName).findOne({ _id: new ObjectId(id as string) });
        if (existingEmployee && existingEmployee.createdBy !== req.user?.username) {
            return res.status(403).json({ error: 'Access denied' });
        }
    }

    const result = await db
      .collection(collectionName)
      .deleteOne({ _id: new ObjectId(id as string) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Notify admin
    if (req.user?.role !== 'admin') {
      notifyAdmin({
        type: 'EMPLOYEE_DELETED',
        message: `An employee was deleted by ${req.user?.username}`,
        data: { id },
        timestamp: new Date()
      });
    }

    res.json({ deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});
export default router;