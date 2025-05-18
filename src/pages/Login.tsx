import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';
import Header from '../components/Header';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Login: React.FC = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 pb-12 flex flex-col justify-center bg-gray-50">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Log in to your account
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Or{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-500">
              create an account
            </Link>
          </p>
        </div>
        
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {error && (
              <div className="mb-4 bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <Input
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                startIcon={<Mail size={18} className="text-gray-400" />}
                autoComplete="email"
              />
              
              <Input
                id="password"
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                startIcon={<Lock size={18} className="text-gray-400" />}
                autoComplete="current-password"
              />
              
              <div>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={loading}
                >
                  Log in
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;