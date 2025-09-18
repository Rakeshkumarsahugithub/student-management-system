import mongoose, { Document } from 'mongoose';
export interface IStudent extends Document {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    gender: 'Male' | 'Female' | 'Other';
    address: string;
    courseEnrolled: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
declare const Student: mongoose.Model<IStudent, {}, {}, {}, mongoose.Document<unknown, {}, IStudent, {}, {}> & IStudent & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default Student;
//# sourceMappingURL=Student.d.ts.map