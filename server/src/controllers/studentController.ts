import { Request, Response } from 'express';
import Student, { IStudent } from '../models/Student';
import BackendCrypto from '../utils/crypto';

// Interface for request bodies
interface RegisterStudentRequest {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  courseEnrolled: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface UpdateStudentRequest extends Partial<RegisterStudentRequest> {}

class StudentController {
  
  /**
   * Register a new student with 2-level encryption
   */
  static async register(req: Request<{}, {}, RegisterStudentRequest>, res: Response) {
    try {
      const {
        fullName,
        email,
        phone,
        dateOfBirth,
        gender,
        address,
        courseEnrolled,
        password
      } = req.body;

      // Validate required fields
      if (!fullName || !email || !phone || !dateOfBirth || !gender || !address || !courseEnrolled || !password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }

      // Check if student already exists (need to encrypt email to check)
      // Email comes already Level 1 encrypted from frontend, apply Level 2
      const encryptedEmailForCheck = BackendCrypto.encrypt(email);
      const existingStudent = await Student.findOne({ email: encryptedEmailForCheck });
      
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'Student with this email already exists'
        });
      }

      // Hash password for authentication
      const hashedPassword = BackendCrypto.hashPassword(password);

      // Prepare student data (data comes already encrypted from frontend - Level 1)
      // Now apply Level 2 encryption before storing in database
      const studentData = {
        fullName,           // Already Level 1 encrypted from frontend
        email,              // Already Level 1 encrypted from frontend
        phone,              // Already Level 1 encrypted from frontend
        dateOfBirth: new Date(dateOfBirth), // Not encrypted
        gender,             // Not encrypted
        address,            // Already Level 1 encrypted from frontend
        courseEnrolled,     // Already Level 1 encrypted from frontend
        password: hashedPassword // Hashed password (will be encrypted in next step)
      };

      // Apply Level 2 encryption for database storage
      const doubleEncryptedStudent = BackendCrypto.encryptStudentForDB(studentData);

      // Create and save student
      const student = new Student(doubleEncryptedStudent);
      const savedStudent = await student.save();

      // Generate authentication token
      const authToken = BackendCrypto.generateAuthToken({ 
        studentId: savedStudent._id,
        email: email // Keep original encrypted email from frontend for token
      });

      // Prepare response (decrypt Level 2 only, leaving Level 1 for frontend)
      const responseStudent = BackendCrypto.decryptStudentFromDB(savedStudent.toObject());
      const { password: _, ...studentWithoutPassword } = responseStudent;

      res.status(201).json({
        success: true,
        message: 'Student registered successfully',
        data: {
          student: studentWithoutPassword,
          token: authToken
        }
      });

    } catch (error: any) {
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
  static async login(req: Request<{}, {}, LoginRequest>, res: Response) {
    try {
      const { email, password: loginPassword } = req.body;

      if (!email || !loginPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // The email comes already Level 1 encrypted from frontend
      // Apply Level 2 encryption to match what's stored in database
      const doubleEncryptedEmail = BackendCrypto.encrypt(email);
      
      // Find student with exact email match
      const student = await Student.findOne({ 
        email: doubleEncryptedEmail,
        isActive: true 
      });
      
      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Decrypt password from database (remove Level 2 encryption first)
      let passwordHash;
      try {
        passwordHash = BackendCrypto.decrypt(student.password);
      } catch (error: any) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }
      
      // Verify the login password against the stored hash
      const isPasswordValid = BackendCrypto.verifyPassword(loginPassword, passwordHash);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate authentication token
      const authToken = BackendCrypto.generateAuthToken({ 
        studentId: student._id,
        email: email // Keep Level 1 encrypted email for frontend
      });

      // Prepare response (decrypt Level 2 only)
      const responseStudent = BackendCrypto.decryptStudentFromDB(student.toObject());
      const { password: _pwd, ...studentWithoutPassword } = responseStudent;

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          student: studentWithoutPassword,
          token: authToken
        }
      });

    } catch (error: any) {
      console.error('Login error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  /**
   * Get all students
   */
  static async getAllStudents(req: Request, res: Response) {
    try {
      // Fetch all active students from database
      const students = await Student.find({ isActive: true }).sort({ createdAt: -1 });

      // Decrypt Level 2 encryption only (leaving Level 1 for frontend)
      const responseStudents = students.map(student => {
        const studentObj = BackendCrypto.decryptStudentFromDB(student.toObject());
        const { password: _pwd, ...studentWithoutPassword } = studentObj;
        return studentWithoutPassword;
      });

      res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: {
          students: responseStudents,
          count: responseStudents.length
        }
      });

    } catch (error: any) {
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
  static async updateStudent(req: Request<{ id: string }, {}, UpdateStudentRequest>, res: Response) {
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
      const student = await Student.findById(id);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Prepare update data with Level 2 encryption
      const encryptedUpdateData: any = {};
      
      // Only encrypt and update fields that are provided
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof UpdateStudentRequest] !== undefined) {
          if (['fullName', 'email', 'phone', 'address', 'courseEnrolled'].includes(key)) {
            // Apply Level 2 encryption to Level 1 encrypted data
            encryptedUpdateData[key] = BackendCrypto.encrypt(updateData[key as keyof UpdateStudentRequest] as string);
          } else if (key === 'password' && updateData[key as keyof UpdateStudentRequest]) {
            // Hash password if provided
            encryptedUpdateData[key] = BackendCrypto.hashPassword(updateData[key as keyof UpdateStudentRequest] as string);
          } else {
            // Non-encrypted fields (dateOfBirth, gender)
            encryptedUpdateData[key] = updateData[key as keyof UpdateStudentRequest];
          }
        }
      });

      // Update student
      const updatedStudent = await Student.findByIdAndUpdate(
        id,
        { $set: encryptedUpdateData },
        { new: true, runValidators: true }
      );

      if (!updatedStudent) {
        return res.status(404).json({
          success: false,
          message: 'Student not found after update'
        });
      }

      // Prepare response (decrypt Level 2 only)
      try {
        const responseStudent = BackendCrypto.decryptStudentFromDB(updatedStudent.toObject());
        // Remove password from response
        const { password: _updatePwd, ...studentWithoutPassword } = responseStudent;

        res.status(200).json({
          success: true,
          message: 'Student updated successfully',
          data: {
            student: studentWithoutPassword
          }
        });
      } catch (decryptError) {
        console.error('Decryption error during response:', decryptError);
        // If decryption fails, return without decryption
        const { password: _errPwd, ...studentWithoutPassword } = updatedStudent.toObject();
        
        res.status(200).json({
          success: true,
          message: 'Student updated successfully (decryption skipped)',
          data: {
            student: studentWithoutPassword
          }
        });
      }

    } catch (error: any) {
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
  static async deleteStudent(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      // Soft delete by setting isActive to false
      const deletedStudent = await Student.findByIdAndUpdate(
        id,
        { $set: { isActive: false } },
        { new: true }
      );

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

    } catch (error: any) {
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
  static async getStudentById(req: Request<{ id: string }>, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      const student = await Student.findOne({ _id: id, isActive: true });
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Prepare response (decrypt Level 2 only)
      const responseStudent = BackendCrypto.decryptStudentFromDB(student.toObject());
      const { password: _getPwd, ...studentWithoutPassword } = responseStudent;

      res.status(200).json({
        success: true,
        message: 'Student retrieved successfully',
        data: {
          student: studentWithoutPassword
        }
      });

    } catch (error: any) {
      console.error('Get student error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching student',
        error: error.message
      });
    }
  }
}

export default StudentController;