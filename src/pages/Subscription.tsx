import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, CheckCircle2, AlertCircle, BarChart3, Clock, Loader2 } from 'lucide-react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

const UpdatePaymentMethodForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { updatePaymentMethod, subscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !subscription) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error: cardError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
      });

      if (cardError) {
        setError(cardError.message || 'An error occurred');
        return;
      }

      if (!paymentMethod) {
        setError('Failed to process payment method');
        return;
      }

      await updatePaymentMethod(paymentMethod.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update payment method');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Update Payment Method</h3>
          <img src="/assets/Powered by Stripe - blurple.svg" alt="Powered by Stripe" className="h-8" />
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Secure payment processing by Stripe</span>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <CardElement 
              className="p-3 bg-white rounded-md shadow-sm border border-gray-300" 
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
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!stripe || isLoading}
            onClick={handleSubmit}
          >
            Update Payment Method
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Your payment information is encrypted and secure</span>
        </div>
      </div>
    </div>
  );
};

// Separate component for handling Stripe-related functionality
const SubscriptionManager: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stripe = useStripe();
  const {
    subscription,
    loading,
    error,
    plans,
    cancelSubscription,
    updateSubscription,
    refreshSubscription,
    reactivateSubscription,
  } = useSubscription();
  const [showUpdatePayment, setShowUpdatePayment] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const handleViewBillingHistory = () => {
    navigate('/billing-history');
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      await cancelSubscription();
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setIsCanceling(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription) return;
    
    setIsReactivating(true);
    try {
      await reactivateSubscription(subscription.id);
      await refreshSubscription();
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
    } finally {
      setIsReactivating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'canceled':
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-50';
      case 'incomplete':
      case 'incomplete_expired':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDisplayStatus = (subscription: any) => {
    if (subscription.cancel_at_period_end) {
      return 'Canceled';
    }
    
    switch (subscription.status.toLowerCase()) {
      case 'active':
        return 'Active';
      case 'past_due':
        return 'Past Due';
      case 'incomplete':
        return 'Payment Required';
      case 'incomplete_expired':
        return 'Payment Failed';
      case 'canceled':
      case 'cancelled':
        return 'Canceled';
      default:
        return subscription.status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Subscription</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="mt-1 text-gray-500">Manage your subscription and billing details</p>
        </div>

        {user && subscription ? (
          <div className="space-y-6">
            {/* Current Plan Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {subscription.items.data[0].price.product.name}
                    </h2>
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-lg font-semibold bg-primary-50 text-primary-700">
                      {capitalizeFirstLetter(subscription.tier.name)} Tier
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {subscription.tier.description}
                    </div>
                  </div>
                  <Button variant="outline" as="link" to="/pricing">
                    Change Plan
                  </Button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar size={20} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {subscription.cancel_at_period_end ? 'Subscription Ends' : 'Next Renewal'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                          {subscription.cancel_at_period_end && (
                            <span className="ml-2 text-red-600">(Cancellation scheduled)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Payment Method</p>
                        <p className="text-sm text-gray-600 capitalize">
                          {subscription.default_payment_method?.card ? 
                            `${subscription.default_payment_method.card.brand} ending in ${subscription.default_payment_method.card.last4}` :
                            'No payment method on file'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <BarChart3 size={20} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Events Usage</p>
                        <p className="text-sm text-gray-600">
                          {subscription.tier.current_usage} of {' '}
                          {subscription.tier.event_limit === -1 ? 'Unlimited' : subscription.tier.event_limit} events this month
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock size={20} className="text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Started On</p>
                        <p className="text-sm text-gray-600">
                          {new Date(subscription.start_date * 1000).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage Progress Bar */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Events Usage</span>
                    <span className="text-gray-500">
                      {subscription.tier.event_limit === -1 
                        ? 'Unlimited' 
                        : `${Math.min(Math.round((subscription.tier.current_usage / subscription.tier.event_limit) * 100), 100)}%`
                      }
                    </span>
                  </div>
                  {subscription.tier.event_limit !== -1 && (
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          subscription.tier.current_usage >= subscription.tier.event_limit 
                            ? 'bg-red-600' 
                            : subscription.tier.current_usage >= subscription.tier.event_limit * 0.8 
                              ? 'bg-yellow-600' 
                              : 'bg-primary-600'
                        }`}
                        style={{ 
                          width: `${Math.min((subscription.tier.current_usage / subscription.tier.event_limit) * 100, 100)}%` 
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with next billing info */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {subscription.cancel_at_period_end 
                      ? `Access until ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`
                      : `Next billing amount on ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}`
                    }
                  </div>
                  {!subscription.cancel_at_period_end && (
                    <div className="text-sm font-medium text-gray-900">
                      ${(subscription.items.data[0].price.unit_amount / 100).toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowUpdatePayment(true)}
                  disabled={loading}
                >
                  Update Payment Method
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleViewBillingHistory}
                  disabled={loading}
                >
                  View Billing History
                </Button>
                {subscription.cancel_at_period_end ? (
                  <Button 
                    variant="outline"
                    onClick={handleReactivateSubscription}
                    isLoading={isReactivating}
                    disabled={loading}
                  >
                    <span className="text-primary-600">Reactivate Subscription</span>
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowCancelConfirm(true)}
                    disabled={loading}
                  >
                    Cancel Subscription
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h2>
            <p className="text-gray-600 mb-6">
              Subscribe to a plan to unlock all features and start creating events.
            </p>
            <Button as="link" to="/pricing">
              View Plans
            </Button>
          </div>
        )}
      </div>

      {/* Update Payment Method Modal */}
      {showUpdatePayment && (
        <UpdatePaymentMethodForm onClose={() => setShowUpdatePayment(false)} />
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Cancel Subscription</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to cancel your subscription? You'll still have access until the end of your billing period.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCanceling}
              >
                Keep Subscription
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelSubscription}
                isLoading={isCanceling}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main component wrapped with Elements provider
const Subscription: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionManager />
    </Elements>
  );
};

const SubscriptionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  planName: string;
  price: number;
}> = ({ isOpen, onClose, planId, planName, price }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createSubscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

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

      await createSubscription(planId, paymentMethod.id);
      onClose();
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full overflow-hidden flex">
        {/* Left side - Plan details */}
        <div className="bg-blue-600 text-white p-8 w-2/5">
          <div className="mb-8">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{planName}</h2>
            <div className="flex items-baseline mb-4">
              <span className="text-3xl font-bold">${price}</span>
              <span className="ml-2 opacity-80">/month</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Up to {planName === 'Starter' ? '12' : planName === 'Professional' ? '30' : 'Unlimited'} events per month</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Advanced analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Priority support</span>
            </div>
          </div>

          <div className="mt-auto pt-8">
            <img src="/assets/Powered by Stripe - blurple.svg" alt="Powered by Stripe" className="h-8 invert opacity-75" />
          </div>
        </div>

        {/* Right side - Payment form */}
        <div className="p-8 w-3/5">
          <div className="max-w-md mx-auto">
            <h3 className="text-xl font-semibold mb-6">Complete your subscription</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Information
                  </label>
                  <div className="bg-white rounded-lg border border-gray-300">
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
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  disabled={!stripe || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                >
                  Pay ${price}.00
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure payment processing · Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription; 