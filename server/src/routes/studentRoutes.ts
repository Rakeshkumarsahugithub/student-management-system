import express from 'express';
import StudentController from '../controllers/studentController';
import { authenticateToken, authRateLimit } from '../utils/crypto';

const router = express.Router();

// Authentication routes (no auth required, but rate limited)
router.post('/login', authRateLimit.middleware(), StudentController.login);
router.post('/register', authRateLimit.middleware(), StudentController.register);

// Student CRUD routes (auth required)
router.get('/students', authenticateToken, StudentController.getAllStudents);
router.get('/student/:id', authenticateToken, StudentController.getStudentById);
router.put('/student/:id', authenticateToken, StudentController.updateStudent);
router.delete('/student/:id', authenticateToken, StudentController.deleteStudent);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Management API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;