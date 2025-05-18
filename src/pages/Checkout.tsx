import React, { useState } from 'react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Button from '../components/ui/Button';

const stripePromise = loadStripe('pk_test_51M4cwzGP3zCuUQUNyhYATvfk4Dt5TT9wEOyt0ozJRdWyqq4gXYRjvdAsoZEjnmknQUjUYICHGxdStDQxNsNsYuyP00fEyFrasn');

const CheckoutForm: React.FC = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsLoading(true);

    // Call your backend to create a PaymentIntent
    const res = await fetch('http://localhost:4242/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 2000, currency: 'usd' }), // $20 for example
    });
    const { clientSecret } = await res.json();

    if (!stripe || !elements) {
      setError('Stripe is not loaded');
      setIsLoading(false);
      return;
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });

    if (result.error) {
      setError(result.error.message || 'Payment failed');
    } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      setSuccess(true);
    }
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md mt-12">
      <h2 className="text-2xl font-bold mb-6 text-center">Checkout</h2>
      <div className="mb-4">
        <CardElement className="p-3 border rounded-md" options={{ hidePostalCode: true }} />
      </div>
      {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
      {success && <div className="text-green-600 mb-4 text-center">Payment successful!</div>}
      <Button type="submit" fullWidth isLoading={isLoading} disabled={!stripe || isLoading}>
        Pay $20
      </Button>
    </form>
  );
};

const Checkout: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  </div>
);

export default Checkout; 