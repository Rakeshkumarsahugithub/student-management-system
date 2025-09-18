import mongoose, { Document, Schema } from 'mongoose';

// Student interface for TypeScript
export interface IStudent extends Document {
  fullName: string;           // Encrypted
  email: string;              // Encrypted
  phone: string;              // Encrypted
  dateOfBirth: Date;          // Not encrypted (non-sensitive)
  gender: 'Male' | 'Female' | 'Other'; // Not encrypted
  address: string;            // Encrypted
  courseEnrolled: string;     // Encrypted
  password: string;           // Encrypted + Hashed
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Student schema definition
const StudentSchema: Schema = new Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  courseEnrolled: {
    type: String,
    required: [true, 'Course enrolled is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'students'
});

// Index for faster queries
// Note: email index is automatically created by unique: true constraint
StudentSchema.index({ isActive: 1 });

// Pre-save middleware for additional validation
StudentSchema.pre('save', function(next) {
  // Validate date of birth (student should be at least 16 years old)
  const currentDate = new Date();
  const minimumAge = new Date(currentDate.getFullYear() - 16, currentDate.getMonth(), currentDate.getDate());
  
  if (this.dateOfBirth && this.dateOfBirth > minimumAge) {
    const error = new Error('Student must be at least 16 years old');
    return next(error);
  }
  
  next();
});

// Instance methods
StudentSchema.methods.toJSON = function() {
  const student = this.toObject();
  // Remove sensitive fields from JSON response
  delete student.password;
  delete student.__v;
  return student;
};

// Static methods
StudentSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email, isActive: true });
};

StudentSchema.statics.findActiveStudents = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Create and export the model
const Student = mongoose.model<IStudent>('Student', StudentSchema);

export default Student;