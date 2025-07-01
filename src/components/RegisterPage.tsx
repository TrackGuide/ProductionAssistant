<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { Spinner } from './Spinner';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
  onNavigateBack: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ 
  onNavigateToLogin, 
  onNavigateBack 
}) => {
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      onNavigateBack();
    }
  }, [isAuthenticated, onNavigateBack]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
    } catch (error) {
      // Error is handled by the store
    }
  };

  const isFormValid = formData.email && formData.username && formData.password && 
                     formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-gray-100 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #FF5722 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-orange-500 transform rotate-45 flex items-center justify-center">
              <div className="w-4 h-4 bg-white transform -rotate-45"></div>
            </div>
            <h1 className="text-3xl font-bold text-white">TrackGuide</h1>
          </div>
          <p className="text-gray-400">Create your account</p>
        </div>

        <Card className="bg-gray-800/80 backdrop-blur-md shadow-xl border border-gray-700/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <Input
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                required
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-between">
              <Button
                label="Register"
                type="submit"
                disabled={!isFormValid || isLoading}
                className="bg-green-500 hover:bg-green-600"
              />
              <Button
                label="Back"
                onClick={onNavigateBack}
                className="bg-gray-500 hover:bg-gray-600"
              />
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
=======
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const RegisterPage: React.FC = () => {
  const { register, continueAsGuest } = useUser();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      setError('Please enter username and email.');
      return;
    }
    register({ username, email });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            className="w-full border p-2 rounded"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button className="w-full bg-green-600 text-white py-2 rounded" type="submit">Register</button>
        </form>
        <div className="mt-4 text-center">
          <button className="text-blue-500 underline" onClick={continueAsGuest}>Continue as Guest</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
>>>>>>> b8fad199 (commit "07.01")
