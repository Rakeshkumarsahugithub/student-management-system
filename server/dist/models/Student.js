"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// Student schema definition
const StudentSchema = new mongoose_1.Schema({
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
// Index for faster queries (on encrypted email - for login)
StudentSchema.index({ email: 1 });
StudentSchema.index({ isActive: 1 });
// Pre-save middleware for additional validation
StudentSchema.pre('save', function (next) {
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
StudentSchema.methods.toJSON = function () {
    const student = this.toObject();
    // Remove sensitive fields from JSON response
    delete student.password;
    delete student.__v;
    return student;
};
// Static methods
StudentSchema.statics.findByEmail = function (email) {
    return this.findOne({ email, isActive: true });
};
StudentSchema.statics.findActiveStudents = function () {
    return this.find({ isActive: true }).sort({ createdAt: -1 });
};
// Create and export the model
const Student = mongoose_1.default.model('Student', StudentSchema);
exports.default = Student;
//# sourceMappingURL=Student.js.map