import { Request, Response } from 'express';
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
interface UpdateStudentRequest extends Partial<RegisterStudentRequest> {
}
declare class StudentController {
    /**
     * Register a new student with 2-level encryption
     */
    static register(req: Request<{}, {}, RegisterStudentRequest>, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Login student
     */
    static login(req: Request<{}, {}, LoginRequest>, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get all students
     */
    static getAllStudents(req: Request, res: Response): Promise<void>;
    /**
     * Update student by ID
     */
    static updateStudent(req: Request<{
        id: string;
    }, {}, UpdateStudentRequest>, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Delete student by ID (soft delete)
     */
    static deleteStudent(req: Request<{
        id: string;
    }>, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get student by ID
     */
    static getStudentById(req: Request<{
        id: string;
    }>, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
export default StudentController;
//# sourceMappingURL=studentController.d.ts.map