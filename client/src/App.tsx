import { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import StudentForm from './components/StudentForm';
import StudentList from './components/StudentList';

type AppView = 'login' | 'register' | 'studentList' | 'editStudent';

interface CurrentUser {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  courseEnrolled: string;
}

function App() {
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const userEmail = localStorage.getItem('userEmail');
    
    if (token && userEmail) {
      setIsAuthenticated(true);
      setCurrentView('studentList');
      // Note: In a real app, you'd validate the token with the backend
    }
  }, []);

  const handleLoginSuccess = (data: { student: CurrentUser; token: string }) => {
    setCurrentUser(data.student);
    setIsAuthenticated(true);
    setCurrentView('studentList');
  };

  const handleRegistrationSuccess = (data: { student: CurrentUser; token: string; isEditing?: boolean }) => {
    if (data.isEditing) {
      // Update current user if editing own profile
      if (currentUser && currentUser._id === data.student._id) {
        setCurrentUser(data.student);
      }
      setCurrentView('studentList');
      setEditingStudent(null);
    } else {
      // New registration
      setCurrentUser(data.student);
      setIsAuthenticated(true);
      setCurrentView('studentList');
    }
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setCurrentView('editStudent');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setEditingStudent(null);
    setCurrentView('login');
  };

  const switchToRegister = () => {
    setCurrentView('register');
  };

  const switchToLogin = () => {
    setCurrentView('login');
  };

  const goBackToStudentList = () => {
    setEditingStudent(null);
    setCurrentView('studentList');
  };

  return (
    <div className="App min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {currentView === 'login' && (
        <div className="fade-in">
          <LoginForm 
            onLoginSuccess={handleLoginSuccess}
            onSwitchToRegister={switchToRegister}
          />
        </div>
      )}
      
      {currentView === 'register' && (
        <div className="fade-in">
          <StudentForm 
            onRegistrationSuccess={handleRegistrationSuccess}
            onSwitchToLogin={switchToLogin}
          />
        </div>
      )}
      
      {currentView === 'studentList' && isAuthenticated && (
        <div className="fade-in">
          <StudentList 
            onEditStudent={handleEditStudent}
            onLogout={handleLogout}
            currentUser={currentUser}
          />
        </div>
      )}
      
      {currentView === 'editStudent' && editingStudent && (
        <div className="fade-in">
          <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 px-6 py-6 mb-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  Edit Student Profile
                </h1>
                <p className="text-sm text-gray-600">
                  Updating information for <span className="font-semibold text-blue-600">{editingStudent.fullName}</span>
                </p>
              </div>
              <button
                onClick={goBackToStudentList}
                className="btn-secondary flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Student List</span>
              </button>
            </div>
          </div>
          <StudentForm 
            onRegistrationSuccess={handleRegistrationSuccess}
            onSwitchToLogin={switchToLogin}
            student={editingStudent}
            isEditing={true}
          />
        </div>
      )}
    </div>
  );
}

export default App;
