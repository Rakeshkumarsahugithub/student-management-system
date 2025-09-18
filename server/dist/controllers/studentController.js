"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Student_1 = __importDefault(require("../models/Student"));
const crypto_1 = __importDefault(require("../utils/crypto"));
class StudentController {
    /**
     * Register a new student with 2-level encryption
     */
    static async register(req, res) {
        try {
            const { fullName, email, phone, dateOfBirth, gender, address, courseEnrolled, password } = req.body;
            // Validate required fields
            if (!fullName || !email || !phone || !dateOfBirth || !gender || !address || !courseEnrolled || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required'
                });
            }
            // Check if student already exists (need to encrypt email to check)
            const encryptedEmailForCheck = crypto_1.default.encrypt(email);
            const existingStudent = await Student_1.default.findOne({ email: encryptedEmailForCheck });
            if (existingStudent) {
                return res.status(409).json({
                    success: false,
                    message: 'Student with this email already exists'
                });
            }
            // Hash password for authentication
            const hashedPassword = crypto_1.default.hashPassword(password);
            // Prepare student data (data comes already encrypted from frontend - Level 1)
            // Now apply Level 2 encryption before storing in database
            const studentData = {
                fullName, // Already Level 1 encrypted from frontend
                email, // Already Level 1 encrypted from frontend
                phone, // Already Level 1 encrypted from frontend
                dateOfBirth: new Date(dateOfBirth), // Not encrypted
                gender, // Not encrypted
                address, // Already Level 1 encrypted from frontend
                courseEnrolled, // Already Level 1 encrypted from frontend
                password: hashedPassword // Hashed password
            };
            // Apply Level 2 encryption for database storage
            const doubleEncryptedStudent = crypto_1.default.encryptStudentForDB(studentData);
            // Create and save student
            const student = new Student_1.default(doubleEncryptedStudent);
            const savedStudent = await student.save();
            // Generate authentication token
            const authToken = crypto_1.default.generateAuthToken({
                studentId: savedStudent._id,
                email: email // Keep original encrypted email from frontend for token
            });
            // Prepare response (decrypt Level 2 only, leaving Level 1 for frontend)
            const responseStudent = crypto_1.default.decryptStudentFromDB(savedStudent.toObject());
            delete responseStudent.password; // Remove password from response
            res.status(201).json({
                success: true,
                message: 'Student registered successfully',
                data: {
                    student: responseStudent,
                    token: authToken
                }
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during registration',
                error: error.message
            });
        }
    }
    /**
     * Login student
     */
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email and password are required'
                });
            }
            // Encrypt email to find in database (need to match Level 2 encryption)
            const doubleEncryptedEmail = crypto_1.default.encrypt(email); // email is already Level 1 encrypted
            // Find student
            const student = await Student_1.default.findOne({ email: doubleEncryptedEmail, isActive: true });
            if (!student) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            // Decrypt password from database and verify
            const decryptedPassword = crypto_1.default.decrypt(student.password);
            const isPasswordValid = crypto_1.default.verifyPassword(password, decryptedPassword);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials'
                });
            }
            // Generate authentication token
            const authToken = crypto_1.default.generateAuthToken({
                studentId: student._id,
                email: email // Keep Level 1 encrypted email for frontend
            });
            // Prepare response (decrypt Level 2 only)
            const responseStudent = crypto_1.default.decryptStudentFromDB(student.toObject());
            delete responseStudent.password;
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    student: responseStudent,
                    token: authToken
                }
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login',
                error: error.message
            });
        }
    }
    /**
     * Get all students
     */
    static async getAllStudents(req, res) {
        try {
            // Fetch all active students from database
            const students = await Student_1.default.find({ isActive: true }).sort({ createdAt: -1 });
            // Decrypt Level 2 encryption only (leaving Level 1 for frontend)
            const responseStudents = students.map(student => {
                const studentObj = crypto_1.default.decryptStudentFromDB(student.toObject());
                delete studentObj.password; // Remove password from response
                return studentObj;
            });
            res.status(200).json({
                success: true,
                message: 'Students retrieved successfully',
                data: {
                    students: responseStudents,
                    count: responseStudents.length
                }
            });
        }
        catch (error) {
            console.error('Get students error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching students',
                error: error.message
            });
        }
    }
    /**
     * Update student by ID
     */
    static async updateStudent(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID is required'
                });
            }
            // Find student
            const student = await Student_1.default.findById(id);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
            // Prepare update data with Level 2 encryption
            const encryptedUpdateData = {};
            // Only encrypt and update fields that are provided
            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined) {
                    if (['fullName', 'email', 'phone', 'address', 'courseEnrolled'].includes(key)) {
                        // Apply Level 2 encryption to Level 1 encrypted data
                        encryptedUpdateData[key] = crypto_1.default.encrypt(updateData[key]);
                    }
                    else if (key === 'password') {
                        // Hash password
                        encryptedUpdateData[key] = crypto_1.default.hashPassword(updateData[key]);
                    }
                    else {
                        // Non-encrypted fields
                        encryptedUpdateData[key] = updateData[key];
                    }
                }
            });
            // Update student
            const updatedStudent = await Student_1.default.findByIdAndUpdate(id, { $set: encryptedUpdateData }, { new: true, runValidators: true });
            if (!updatedStudent) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found after update'
                });
            }
            // Prepare response (decrypt Level 2 only)
            const responseStudent = crypto_1.default.decryptStudentFromDB(updatedStudent.toObject());
            delete responseStudent.password;
            res.status(200).json({
                success: true,
                message: 'Student updated successfully',
                data: {
                    student: responseStudent
                }
            });
        }
        catch (error) {
            console.error('Update student error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during update',
                error: error.message
            });
        }
    }
    /**
     * Delete student by ID (soft delete)
     */
    static async deleteStudent(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID is required'
                });
            }
            // Soft delete by setting isActive to false
            const deletedStudent = await Student_1.default.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
            if (!deletedStudent) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
            res.status(200).json({
                success: true,
                message: 'Student deleted successfully',
                data: {
                    studentId: id
                }
            });
        }
        catch (error) {
            console.error('Delete student error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during deletion',
                error: error.message
            });
        }
    }
    /**
     * Get student by ID
     */
    static async getStudentById(req, res) {
        try {
            const { id } = req.params;
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Student ID is required'
                });
            }
            const student = await Student_1.default.findOne({ _id: id, isActive: true });
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
            // Prepare response (decrypt Level 2 only)
            const responseStudent = crypto_1.default.decryptStudentFromDB(student.toObject());
            delete responseStudent.password;
            res.status(200).json({
                success: true,
                message: 'Student retrieved successfully',
                data: {
                    student: responseStudent
                }
            });
        }
        catch (error) {
            console.error('Get student error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while fetching student',
                error: error.message
            });
        }
    }
}
exports.default = StudentController;
//# sourceMappingURL=studentController.js.map