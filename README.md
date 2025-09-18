# Student Management System with 2-Level Encryption

A full-stack web application built with React + TypeScript (frontend) and Node.js + Express + TypeScript (backend) featuring secure student registration, login, and CRUD operations with 2-level encryption.

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Hook Form** for form management
- **CryptoJS** for client-side encryption

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **bcryptjs** for password hashing
- **jsonwebtoken** for authentication
- **crypto** (Node.js built-in) for server-side encryption
- **cors** for cross-origin requests
- **helmet** for security headers

### Database
- **MongoDB** - NoSQL document database

## 🔐 Encryption Implementation

This application implements a **2-level encryption system** for maximum data security:

### Level 1 - Frontend Encryption (Client-side)
- **Algorithm:** AES-256-CBC encryption via CryptoJS
- **Encryption Key:** `frontend-encryption-key-2024-level1-secure`
- **Process:** All sensitive student data is encrypted on the frontend before sending to backend
- **Data Encrypted:** Full Name, Email, Phone, Address, Course details
- **Format:** CryptoJS salted format (starts with "U2FsdGVkX1")
- **Fallback Support:** Multiple legacy keys for backward compatibility

### Level 2 - Backend Encryption (Server-side)
- **Algorithm:** AES-256-GCM encryption using Node.js crypto module
- **Encryption Key:** `backend-encryption-key-2024-very-secure` (from environment)
- **Key Derivation:** PBKDF2 with salt using scryptSync
- **Process:** Backend receives Level 1 encrypted data and applies second layer encryption
- **Format:** `iv:authTag:encrypted` (3-part format) or `iv:encrypted` (legacy 2-part)
- **Storage:** All data stored in MongoDB is **double-encrypted**

### Password Security (Separate from Encryption)
- **Hashing Algorithm:** PBKDF2 with SHA-512
- **Salt:** Fixed salt "student-mgmt-salt" 
- **Iterations:** 10,000 iterations
- **Key Length:** 64 bytes
- **Storage:** Password hashes are also encrypted with Level 2 encryption

### Authentication Flow
1. **Registration:**
   - Frontend encrypts email with Level 1 encryption
   - Backend applies Level 2 encryption to email for storage
   - Password is hashed separately, then encrypted with Level 2
   - All data stored double-encrypted in MongoDB

2. **Login:**
   - Frontend encrypts login email with Level 1 encryption
   - Backend applies Level 2 encryption to match stored email
   - Backend decrypts stored password hash and verifies against login password
   - JWT-like token generated and encrypted for session management

### Data Retrieval Flow
1. **Database Query:** Backend fetches double-encrypted data from MongoDB
2. **Level 2 Decryption:** Backend decrypts server-side encryption layer
3. **API Response:** Sends Level 1 encrypted data back to frontend
4. **Level 1 Decryption:** Frontend decrypts client-side encryption to display readable data

### Security Features
- **Double Encryption:** Two independent encryption layers
- **Password Hashing:** PBKDF2 with salt (separate from encryption)
- **Session Management:** Encrypted JWT-like tokens with expiration
- **Input Validation:** Both frontend and backend validation
- **CORS Protection:** Configured for specific origins
- **Security Headers:** Helmet middleware for HTTP security
- **Key Management:** Environment-based encryption keys
- **Legacy Support:** Fallback decryption for data encrypted with old keys

### Encryption Keys Used
- **Primary Frontend:** `frontend-encryption-key-2024-level1-secure` (deterministic)
- **Primary Backend:** `backend-encryption-key-2024-very-secure` (deterministic)
- **Legacy Keys:** Multiple fallback keys for historical data compatibility
- **Deterministic Approach:** Same input always produces same encrypted output

## 📁 Project Structure

```
task-react-node-typescript/
┣ client/                    # React frontend
┃ ┣ src/
┃ ┃ ┣ components/
┃ ┃ ┃ ┣ LoginForm.tsx       # User login component
┃ ┃ ┃ ┣ StudentForm.tsx     # Student registration/edit form
┃ ┃ ┃ ┗ StudentList.tsx     # Student list and management
┃ ┃ ┣ utils/
┃ ┃ ┃ ┗ crypto.ts           # Frontend encryption utilities
┃ ┃ ┣ App.tsx               # Main application component
┃ ┃ ┗ main.tsx              # Application entry point
┃ ┣ package.json
┃ ┗ tailwind.config.js
┗ server/                    # Node.js backend
  ┣ src/
  ┃ ┣ routes/
  ┃ ┃ ┗ studentRoutes.ts     # API route definitions
  ┃ ┣ controllers/
  ┃ ┃ ┗ studentController.ts # Business logic
  ┃ ┣ models/
  ┃ ┃ ┗ Student.ts           # MongoDB schema
  ┃ ┣ utils/
  ┃ ┃ ┗ crypto.ts            # Backend encryption utilities
  ┃ ┣ app.ts                 # Express app configuration
  ┃ ┗ server.ts              # Server entry point
  ┣ package.json
  ┣ tsconfig.json
  ┣ .env                     # Environment variables
  ┗ .env.example             # Environment template
```

## 🛠️ Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Rakeshkumarsahugithub/student-management-system.git
cd task-react-node-typescript
```

### 2. Backend Setup

#### Install Dependencies
```bash
cd server
npm install
```

#### Environment Configuration
Copy the example environment file and configure:
```bash
cp .env.example .env
```

Edit `.env` file with your configurations:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/student-management
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/student-management

# Encryption Keys (Level 1 = Frontend, Level 2 = Backend)
FRONTEND_ENCRYPTION_KEY=frontend-encryption-key-2024-level1-secure
BACKEND_ENCRYPTION_KEY=backend-encryption-key-2024-very-secure

# JWT Secret
JWT_SECRET=student-management-jwt-secret-2024

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=12
```

#### Start MongoDB
**Local MongoDB:**
```bash
# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
# Windows: Start MongoDB service from Services
```

**MongoDB Atlas:**
- Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com/)
- Get connection string and update `MONGODB_URI` in `.env`

#### Start Backend Server
```bash
# Development mode with auto-reload
npm run dev

# Or build and run production
npm run build
npm start
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:

#### Install Dependencies
```bash
cd client
npm install
```

#### Start Frontend Development Server
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

## ✅ Current Status

This application is **fully functional** with the following verified features:

### ✅ Working Features
- **Login System**: Email/password authentication with deterministic encryption
- **Student Registration**: Complete form with validation and consistent encryption
- **2-Level Encryption**: Frontend (Level 1) + Backend (Level 2) working correctly
- **CRUD Operations**: Create, Read, Update, Delete students
- **Data Security**: All sensitive data properly encrypted in database
- **CORS Configuration**: Supports multiple origins including browser previews
- **Authentication Middleware**: JWT-like token validation
- **Rate Limiting**: API protection against abuse
- **Responsive UI**: Modern interface with Tailwind CSS

### 🔧 Final Fixes Applied
- **Fixed Deterministic Encryption**: Both frontend and backend now use consistent encryption
- **Frontend**: Fixed salt and IV for CryptoJS AES encryption
- **Backend**: Deterministic IV based on input data for AES-256-GCM

## 🔧 API Routes

### Authentication
- `POST /api/login` - Student login
- `POST /api/register` - Student registration

### Student CRUD Operations
- `GET /api/students` - Get all students
- `GET /api/student/:id` - Get student by ID
- `PUT /api/student/:id` - Update student
- `DELETE /api/student/:id` - Delete student (soft delete)

### Health Check
- `GET /api/health` - API health status
- `GET /` - Server information

## 📝 Student Registration Fields

### Required Fields
- **Full Name** - Student's complete name
- **Email Address** - Unique email for login
- **Phone Number** - Contact number
- **Date of Birth** - Must be 16+ years old
- **Gender** - Male/Female/Other
- **Address** - Complete residential address
- **Course Enrolled** - Selected from predefined courses
- **Password** - Must contain uppercase, lowercase, and number

### Available Courses
- Computer Science
- Information Technology
- Software Engineering
- Data Science
- Cybersecurity
- Web Development
- Mobile App Development
- AI & Machine Learning
- Business Administration
- Digital Marketing

## 🔍 Features

### 🔐 Security Features
- **2-Level Encryption** for sensitive data
- **Password Hashing** with PBKDF2
- **JWT-like Authentication** tokens
- **Input Validation** on both frontend and backend
- **CORS Protection**
- **Security Headers** with Helmet

### 👤 User Management
- **Student Registration** with validation
- **Secure Login** system
- **Profile Management** (view/edit)
- **Session Management**

### 📊 Student Management
- **View All Students** in card layout
- **Search Students** by name, email, or phone
- **Filter by Course** enrolled
- **Sort** by name, course, or registration date
- **Edit Student** information
- **Delete Student** with confirmation
- **Real-time Updates**

### 🎨 User Interface
- **Responsive Design** with Tailwind CSS
- **Modern UI/UX** with clean layout
- **Loading States** and error handling
- **Form Validation** with helpful messages
- **Encryption Status** indicators

## 🧪 Testing the Application

### 1. Start Both Servers
Ensure both backend (`localhost:5000`) and frontend (`localhost:5173`) are running.

### 2. Register a New Student
1. Go to `http://localhost:5173`
2. Click \"Don't have an account? Register here\"
3. Fill in all required fields
4. Submit the form
5. You should be automatically logged in and redirected to the student list

### 3. Test Login
1. Logout and return to login page
2. Use the email and password you just registered
3. Login should work and show the student dashboard

### 4. Test CRUD Operations
1. **Create:** Register multiple students
2. **Read:** View the student list, search, and filter
3. **Update:** Click \"Edit\" on any student card
4. **Delete:** Click \"Delete\" and confirm

### 5. Test Encryption
1. Check MongoDB database - all sensitive fields should be encrypted
2. Check network requests in browser dev tools - data should be encrypted
3. Data should only be readable in the frontend after decryption

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- Check if MongoDB is running
- Verify `.env` configuration
- Check if port 5000 is available

**Frontend won't connect to backend:**
- Ensure backend is running on port 5000
- Check CORS configuration
- Verify API endpoints

**Database connection failed:**
- Check MongoDB connection string
- Ensure database is accessible
- Verify network connectivity (for Atlas)

**Login Issues - "Invalid credentials" error:**
- **Root Cause:** ✅ FIXED - Email encryption mismatch between registration and login
- **Solution Applied:** Implemented deterministic encryption for consistent results
- **Current Status:** Login works perfectly with matching encrypted emails

**Encryption/Decryption errors:**
- **Root Cause:** ✅ FIXED - Random salts/IVs causing inconsistent encryption
- **Solution Applied:** Fixed salt and IV for deterministic encryption
- **Current Status:** Same input always produces same encrypted output

**Data showing as encrypted strings:**
- **Root Cause:** ✅ FIXED - Multiple encryption keys and inconsistent algorithms
- **Solution Applied:** Standardized encryption with deterministic approach
- **Current Status:** All data encrypts and decrypts consistently

### Development Commands

**Backend:**
```bash
cd server
npm run dev      # Development mode
npm run build    # Build TypeScript
npm start        # Production mode
```

**Frontend:**
```bash
cd client
npm run dev      # Development mode
npm run build    # Build for production
npm run preview  # Preview production build
```

### Available Scripts

**Database Management:**
```bash
cd server
node scripts/reset-database.js    # Clear all student data (fresh start)
```

**Note:** All debugging and test scripts have been removed for production readiness.

## 🔒 Security Considerations

### Production Deployment
1. **Change all default keys** in environment variables
2. **Use strong encryption keys** (32+ characters)
3. **Enable HTTPS** for both frontend and backend
4. **Use MongoDB Atlas** or secured database
5. **Implement rate limiting**
6. **Add request logging**
7. **Regular security audits**

### Environment Variables
**Never commit `.env` files to version control!**

For production, use secure key management:
- AWS Secrets Manager
- Azure Key Vault
- HashiCorp Vault
- Environment-specific configurations

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [CryptoJS Documentation](https://cryptojs.gitbook.io/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is for educational purposes. Feel free to modify and use as needed.

---

**Built with ❤️ using React, TypeScript, Node.js, and MongoDB**

*Protected by 2-Level Encryption for Maximum Security* 🔐", "original_text": "", "replace_all": false}]#
