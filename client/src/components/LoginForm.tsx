import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import FrontendCrypto from '../utils/crypto';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onLoginSuccess: (data: any) => void;
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError('');
    console.log('Login attempt with email:', data.email);

    try {
      console.log('Encrypting email...');
      const encryptedEmail = FrontendCrypto.encrypt(data.email);
      console.log('Email encrypted successfully');

      const loginData = {
        email: encryptedEmail,
        password: data.password
      };

      console.log('Sending login request...');
      const response = await axios.post('http://localhost:5000/api/login', loginData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Login response:', response.data);

      if (response.data.success) {
        console.log('Login successful, storing auth token...');
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('userEmail', data.email);

        let decryptedStudent;
        try {
          console.log('Decrypting student data...');
          decryptedStudent = FrontendCrypto.decryptStudentData(response.data.data.student);
          console.log('Student data decrypted successfully');
        } catch (decryptError) {
          console.error('Error decrypting student data:', decryptError);
          throw new Error('Failed to process user data. Please contact support.');
        }

        onLoginSuccess({
          student: decryptedStudent,
          token: response.data.data.token
        });

        reset();
      } else {
        console.warn('Login response not successful:', response.data);
        setError(response.data.message || 'Login failed. Please check your credentials and try again.');
      }
    } catch (error: any) {
      console.error('Login error details:', {
        name: error.name,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      if (error.response?.status === 401) {
        // Handle 401 Unauthorized specifically
        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else {
          setError('Invalid email or password. Please try again or register if you\'re a new user.');
        }
      } else if (error.response?.data?.message) {
        setError(`Server error: ${error.response.data.message}`);
      } else if (error.message) {
        setError(`Error: ${error.message}`);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Student Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your student management account
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type="password"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              Don't have an account? Register here
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500">
            <p>🔐 Your data is protected with 2-level encryption</p>
            <p>Level 1: Frontend AES encryption</p>
            <p>Level 2: Backend AES encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;