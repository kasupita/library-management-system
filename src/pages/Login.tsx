import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLibrary } from '@/contexts/LibraryContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogIn } from 'lucide-react';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export default function Login() {

  const { setTheme } = useTheme();

useEffect(() => {
  setTheme("light");

  return () => {
    // restore system theme after leaving login
    setTheme("system");
  };
}, []);

  
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentUser, refetchData } = useLibrary();
  const navigate = useNavigate();
  

 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const response = await api.login(identifier, password);

    if (response.success && response.data) {
      localStorage.setItem('lms_token', response.data.token);
      setCurrentUser(response.data.user, { establishSession: true });
      await refetchData();
      navigate('/dashboard');
    } else {
      setError(response.error || 'Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-purple-300 to-purple-400">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4">
        <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-purple-300 bg-white shadow-xl md:grid-cols-2">
          
          {/* Left Panel */}
          <div className="hidden md:flex flex-col justify-between p-10 bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800 text-white">
            <div className="flex items-center gap-3">
              <img
                src="https://siba.edu.lk/publication/iris.journal/images/SIBALOGO.png"
                alt="LMS"
                className="h-12 w-auto object-contain"
                loading="eager"
                decoding="async"
              />
              <div>
                <p className="text-sm font-semibold">
                  LIBRARY MANAGEMENT SYSTEM
                </p>
                <p className="text-xs text-purple-200">SIBA Campus</p>
              </div>
            </div>

            <div className="mt-10">
              <h2 className="text-2xl font-semibold tracking-tight">
                Welcome to SIBA Campus Library Management System
              </h2>
              
            </div>

            <p className="text-xs text-purple-300">
              © {new Date().getFullYear()} SIBA LMS
            </p>
          </div>

          {/* Right Panel - Login Form */}
          <div className="p-8 md:p-10 bg-purple-50">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight text-purple-800">
                Sign in
              </h1>
              <p className="text-sm text-purple-600">
                Use your email to continue to the dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-purple-800"
                >
                  Email / Student ID
                </label>
                <Input
                  id="email"
                  placeholder="admin@library.edu or bscwd234008"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoFocus
                  className="border-purple-300 focus-visible:ring-purple-500"
                />
                <p className="text-xs text-purple-600">
                  Student ID format example: <span className="font-mono">bscwd234008</span>
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-purple-800"
                >
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-purple-300 focus-visible:ring-purple-500"
                />
              </div>

              {error && (
                <div className="rounded-md bg-purple-100 p-3 text-sm text-purple-700 border border-purple-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={isLoading}
                className="w-full bg-purple-700 hover:bg-purple-800 text-white transition-all duration-200"
              >
                <LogIn className="mr-2 h-4 w-4" />
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 rounded-md bg-purple-100 p-4 text-xs text-purple-800 border border-purple-200">
              <p className="font-semibold mb-2">Demo Accounts:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>admin@library.edu (Admin)</li>
                <li>jane@library.edu (Librarian)</li>
                <li>drsmith@university.edu (Head of Dept)</li>
                <li>alex@student.edu (Student)</li>
              </ul>
            </div>

            <div className="mt-6 text-sm text-purple-700">
              Student doesn’t have an account?{" "}
              <Link to="/student-signup" className="font-medium text-purple-800 underline underline-offset-4">
                Create one (Student Sign Up)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
