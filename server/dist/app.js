"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
// Load environment variables
dotenv_1.default.config();
class App {
    constructor() {
        this.gracefulShutdown = () => {
            console.log('Received shutdown signal. Closing HTTP server...');
            // Close database connection
            mongoose_1.default.connection.close().then(() => {
                console.log('MongoDB connection closed.');
                process.exit(0);
            }).catch((error) => {
                console.error('Error closing MongoDB connection:', error);
                process.exit(1);
            });
        };
        this.app = (0, express_1.default)();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeDatabase();
        this.initializeErrorHandling();
    }
    initializeMiddlewares() {
        // Security middleware
        this.app.use((0, helmet_1.default)());
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));
        // Body parsing middleware
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    initializeRoutes() {
        // API routes
        this.app.use('/api', studentRoutes_1.default);
        // Root route
        this.app.get('/', (req, res) => {
            res.status(200).json({
                success: true,
                message: 'Student Management System API is running',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                features: [
                    '2-Level Encryption (Frontend + Backend)',
                    'Student Registration & Authentication',
                    'CRUD Operations for Students',
                    'MongoDB Integration',
                    'TypeScript Support'
                ]
            });
        });
        // 404 handler - catch all unmatched routes
        this.app.all('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Route not found',
                path: req.originalUrl
            });
        });
    }
    async initializeDatabase() {
        try {
            const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-management';
            await mongoose_1.default.connect(mongoUrl, {
            // Modern MongoDB connection options
            });
            console.log('✅ Connected to MongoDB successfully');
            // Database event listeners
            mongoose_1.default.connection.on('error', (error) => {
                console.error('❌ MongoDB connection error:', error);
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.log('⚠️ MongoDB disconnected');
            });
        }
        catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error);
            process.exit(1);
        }
    }
    initializeErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global error handler:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                ...(process.env.NODE_ENV === 'development' && { error: error.message })
            });
        });
        // Graceful shutdown handlers
        process.on('SIGTERM', this.gracefulShutdown);
        process.on('SIGINT', this.gracefulShutdown);
    }
}
exports.default = App;
//# sourceMappingURL=app.js.map