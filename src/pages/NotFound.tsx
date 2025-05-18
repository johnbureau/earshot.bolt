import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/ui/Button';

const NotFound: React.FC = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Page Not Found</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default NotFound;