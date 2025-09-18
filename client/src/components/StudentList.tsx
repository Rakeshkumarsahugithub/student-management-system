import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FrontendCrypto from '../utils/crypto';

interface Student {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  courseEnrolled: string;
  createdAt: string;
  updatedAt: string;
}

interface StudentListProps {
  onEditStudent: (student: Student) => void;
  onLogout: () => void;
  currentUser?: any;
}

const StudentList: React.FC<StudentListProps> = ({ onEditStudent, onLogout, currentUser }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'course' | 'date'>('name');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await axios.get('http://localhost:5000/api/students', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.data.success) {
        // Decrypt all student data (Level 1 decryption)
        const decryptedStudents = response.data.data.students.map((student: any) => {
          try {
            return FrontendCrypto.decryptStudentData(student);
          } catch (decryptError) {
            console.warn('Failed to decrypt student data for ID:', student._id);
            // Return student data as-is if decryption fails (for debugging)
            return {
              ...student,
              fullName: student.fullName || 'Encrypted Data',
              email: student.email || 'Encrypted Data',
              phone: student.phone || 'Encrypted Data',
              address: student.address || 'Encrypted Data',
              courseEnrolled: student.courseEnrolled || 'Encrypted Data'
            };
          }
        });
        
        setStudents(decryptedStudents);
      }
    } catch (error: any) {
      console.error('Fetch students error:', error);
      
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('authToken');
        localStorage.removeItem('userEmail');
        onLogout();
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to fetch students. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      setError('');

      const response = await axios.delete(`http://localhost:5000/api/student/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.data.success) {
        // Remove student from local state
        setStudents(prev => prev.filter(student => student._id !== studentId));
        setDeleteConfirm(null);
      }
    } catch (error: any) {
      console.error('Delete student error:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Failed to delete student. Please try again.');
      }
    }
  };

  // Filter and sort students
  const filteredAndSortedStudents = students
    .filter(student => {
      const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.phone.includes(searchTerm);
      const matchesCourse = !filterCourse || student.courseEnrolled === filterCourse;
      return matchesSearch && matchesCourse;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'course':
          return a.courseEnrolled.localeCompare(b.courseEnrolled);
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  const courseOptions = [...new Set(students.map(student => student.courseEnrolled))];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center bg-gray-50">
  //       <div className="text-center">
  //         <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
  //           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
  //           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  //         </svg>
  //         <p className="mt-2 text-gray-600">Loading students...</p>
  //       </div>
  //     </div>
  //   );
  // }
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-3">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-lg text-gray-600">Loading students...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Management System</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Welcome back, {currentUser?.fullName || 'Student'}! 
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    🔐 2-Level Encrypted
                  </span>
                </p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Filter by Course */}
              <div>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Courses</option>
                  {courseOptions.map(course => (
                    <option key={course} value={course}>{course}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'course' | 'date')}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="course">Sort by Course</option>
                  <option value="date">Sort by Date</option>
                </select>
              </div>

              {/* Refresh */}
              <button
                onClick={fetchStudents}
                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Students Count */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedStudents.length} of {students.length} students
          </p>
        </div>

        {/* Students Grid */}
        {filteredAndSortedStudents.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="text-gray-400 text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
            <p className="text-gray-600">
              {searchTerm || filterCourse 
                ? 'Try adjusting your search or filter criteria.'
                : 'No students have been registered yet.'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedStudents.map((student) => (
              <div key={student._id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {student.fullName}
                    </h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {student.gender}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="w-16 font-medium">Email:</span>
                      <span className="truncate">{student.email}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-16 font-medium">Phone:</span>
                      <span>{student.phone}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-16 font-medium">Course:</span>
                      <span className="text-indigo-600 font-medium">{student.courseEnrolled}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-16 font-medium">DOB:</span>
                      <span>{formatDate(student.dateOfBirth)}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="w-16 font-medium flex-shrink-0">Address:</span>
                      <span className="line-clamp-2">{student.address}</span>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    Registered: {formatDate(student.createdAt)}
                  </div>
                </div>

                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
                  <button
                    onClick={() => onEditStudent(student)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    ✏️ Edit
                  </button>
                  
                  {deleteConfirm === student._id ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="text-sm font-medium text-red-600 hover:text-red-500"
                      >
                        ✓ Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-sm font-medium text-gray-600 hover:text-gray-500"
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(student._id)}
                      className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="text-xs text-gray-500">
            <p>🔐 All student data is protected with 2-level encryption</p>
            <p>Level 1: Frontend AES-256 encryption | Level 2: Backend AES-256-GCM encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentList;