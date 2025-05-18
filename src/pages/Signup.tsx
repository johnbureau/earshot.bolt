import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock } from 'lucide-react';
import Header from '../components/Header';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const Signup: React.FC = () => {
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      navigate('/role-selection');
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await signUp(email, password);
      if (error) throw error;
      
      // Note: We'll be redirected once the auth state updates
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-500">
              Log in
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
                autoComplete="new-password"
                helperText="Must be at least 6 characters"
              />
              
              <Input
                id="confirmPassword"
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                startIcon={<Lock size={18} className="text-gray-400" />}
                autoComplete="new-password"
              />
              
              <div>
                <Button
                  type="submit"
                  fullWidth
                  isLoading={loading}
                >
                  Sign up
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;