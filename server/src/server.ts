import App from './app';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create and start the application
const app = new App();

const server = app.app.listen(PORT, () => {
  console.log('🚀 Student Management System Server Started');
  console.log('==========================================');
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Server running on port: ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log('Features:');
  console.log('  ✅ 2-Level Encryption (Frontend + Backend)');
  console.log('  ✅ Student Registration & Authentication');
  console.log('  ✅ CRUD Operations for Students');
  console.log('  ✅ MongoDB Integration');
  console.log('  ✅ TypeScript Support');
  console.log('==========================================');
});

// Handle server errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});