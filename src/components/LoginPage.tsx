import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { Spinner } from './Spinner';

interface LoginPageProps {
  onNavigateToRegister: () => void;
  onNavigateBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onNavigateToRegister, 
  onNavigateBack 
}) => {
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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
      await login(formData);
    } catch (error) {
      // Error is handled by the store
    }
  };

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
          <p className="text-gray-400">Sign in to your account</p>
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
                label="Password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !formData.email || !formData.password}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Spinner size="sm" />
                  <span>Signing in...</span>
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={onNavigateToRegister}
                className="text-orange-400 hover:text-orange-300 font-medium transition-colors"
                disabled={isLoading}
              >
                Sign up
              </button>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onNavigateBack}
              className="text-gray-500 hover:text-gray-400 text-sm transition-colors"
              disabled={isLoading}
            >
              ← Back to app
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};