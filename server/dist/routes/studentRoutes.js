"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const studentController_1 = __importDefault(require("../controllers/studentController"));
const router = express_1.default.Router();
// Authentication routes
router.post('/login', studentController_1.default.login);
router.post('/register', studentController_1.default.register);
// Student CRUD routes
router.get('/students', studentController_1.default.getAllStudents);
router.get('/student/:id', studentController_1.default.getStudentById);
router.put('/student/:id', studentController_1.default.updateStudent);
router.delete('/student/:id', studentController_1.default.deleteStudent);
// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Student Management API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});
exports.default = router;
//# sourceMappingURL=studentRoutes.js.map