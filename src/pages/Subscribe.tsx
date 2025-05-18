import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useSubscription } from '../context/SubscriptionContext';
import Button from '../components/ui/Button';
import { CheckCircle, Shield } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface LocationState {
  planName: string;
  price: number;
  isAnnual: boolean;
}

const SubscribeForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { priceId } = useParams<{ priceId: string }>();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const { createSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Get the features based on plan name
  const getFeatures = () => {
    if (state.planName === "Starter") {
      return [
        "Up to 12 events per month",
        "Booking management",
        "Chat enabled",
        "Payment processing",
        "Basic analytics"
      ];
    } else if (state.planName === "Professional") {
      return [
        "Up to 30 events per month",
        "Booking management",
        "Chat enabled",
        "Payment processing",
        "Basic analytics",
        "Advanced analytics",
        "Financial reporting",
        "Social Post Accelerator",
        "Priority support"
      ];
    }
    return [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !priceId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (cardError) {
        setError(cardError.message || 'An error occurred with your card');
        setIsLoading(false);
        return;
      }

      if (!paymentMethod) {
        setError('Failed to process your payment method');
        setIsLoading(false);
        return;
      }

      await createSubscription(priceId, paymentMethod.id);
      navigate('/dashboard'); // Navigate to dashboard after successful subscription
    } catch (err: any) {
      console.error('Subscription error:', err);
      let errorMessage = 'An unexpected error occurred';
      
      if (err.message?.includes('verification') || 
          err.message?.includes('captcha') || 
          err.message?.includes('authentication')) {
        errorMessage = 'Your card requires additional verification. Please try again or use a different card.';
      } else if (err.message?.includes('card was declined')) {
        errorMessage = 'Your card was declined. Please try a different card.';
      } else if (err.message?.includes('Stripe customer')) {
        errorMessage = 'There was an issue with your account. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const features = getFeatures();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back button section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <svg 
                className="w-5 h-5 mr-2" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" 
                />
              </svg>
              Back to Plans
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 mb-20 md:mb-0">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
          {/* Payment form section */}
          <div className="w-full md:w-7/12 p-6 md:p-8 order-1 md:order-2">
            <div className="max-w-lg">
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900">Complete your subscription</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-700 font-medium">Subscription Summary</span>
                    <span className="text-gray-900 font-semibold">${state.price}/month</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    You'll be charged ${state.price} {state.isAnnual ? 'annually' : 'monthly'}, starting today. You can cancel anytime.
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Card Information
                  </label>
                  <div className="bg-white rounded-md shadow-sm border border-gray-300">
                    <CardElement 
                      className="p-4" 
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                            iconColor: '#6772e5',
                          },
                          invalid: {
                            color: '#9e2146',
                            iconColor: '#9e2146',
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                    {retryCount > 0 && retryCount < maxRetries && (
                      <div className="ml-auto">
                        Attempt {retryCount} of {maxRetries}
                      </div>
                    )}
                  </div>
                )}

                {/* Desktop button */}
                <div className="hidden md:block">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!stripe || isLoading}
                    className="w-full"
                  >
                    Subscribe
                  </Button>
                </div>

                {/* Mobile button */}
                <div className="md:hidden">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!stripe || isLoading}
                    className="w-full"
                  >
                    Subscribe
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Your payment information is encrypted and secure</span>
                </div>
              </form>
            </div>
          </div>

          {/* Features section */}
          <div className="w-full md:w-5/12 bg-gradient-to-br from-primary-500 to-primary-600 p-6 md:p-8 order-2 md:order-1">
            <div className="h-full flex flex-col">
              <div>
                <h2 className="text-2xl font-semibold mb-2 text-white">{state.planName}</h2>
                <p className="text-primary-100 mb-6">Get started with our premium features</p>
              </div>
              
              <div className="flex-grow">
                <div className="space-y-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary-100" />
                      <span className="text-white">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 md:mt-auto">
                <div className="flex items-center gap-2 text-sm text-primary-100">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment processing powered by <span className="font-bold">Stripe</span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Subscribe: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <SubscribeForm />
    </Elements>
  );
};

export default Subscribe; 