import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import studentRoutes from './routes/studentRoutes';
import { generalRateLimit } from './utils/crypto';

// Load environment variables
dotenv.config();

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeDatabase();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(helmet());
    
    // Rate limiting middleware
    this.app.use(generalRateLimit.middleware());
    
    // CORS configuration
    this.app.use(cors({
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://127.0.0.1:51599', // Browser preview origin
        /^http:\/\/127\.0\.0\.1:\d+$/, // Allow any port on 127.0.0.1
        /^http:\/\/localhost:\d+$/ // Allow any port on localhost
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', studentRoutes);

    // Root route
    this.app.get('/', (req: Request, res: Response) => {
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

    // 404 handler - must be last middleware
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
      });
    });
  }

  private async initializeDatabase(): Promise<void> {
    try {
      const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-management';
      
      await mongoose.connect(mongoUrl, {
        // Modern MongoDB connection options
      });
      
      console.log('✅ Connected to MongoDB successfully');
      
      // Database event listeners
      mongoose.connection.on('error', (error) => {
        console.error('❌ MongoDB connection error:', error);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
      });
      
    } catch (error) {
      console.error('❌ Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
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

  private gracefulShutdown = (): void => {
    console.log('Received shutdown signal. Closing HTTP server...');
    
    // Close database connection
    mongoose.connection.close().then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    }).catch((error) => {
      console.error('Error closing MongoDB connection:', error);
      process.exit(1);
    });
  }
}

export default App;