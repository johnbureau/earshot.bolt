import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  X, 
  HelpCircle,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Users,
  MessageSquare,
  Calendar,
  BarChart2
} from 'lucide-react';
import Button from '../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext.tsx';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingTier {
  name: string;
  price: number;
  description: string;
  features: PricingFeature[];
  icon: React.ReactNode;
  color: string;
  popular?: boolean;
  monthlyPriceId: string;
  annualPriceId: string;
}

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

  // Get the features based on plan name
  const getFeatures = () => {
    if (planName === "Starter") {
      return [
        "Up to 12 events per month",
        "Booking management",
        "Chat enabled",
        "Payment processing",
        "Basic analytics"
      ];
    } else if (planName === "Professional") {
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

  const features = getFeatures();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back button section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={onClose}
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
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
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
                    <span className="text-gray-900 font-semibold">${price}/month</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    You'll be charged ${price} monthly, starting today. You can cancel anytime.
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

                {/* Mobile button */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={!stripe || isLoading}
                    className="w-full"
                  >
                    Subscribe
                  </Button>
                </div>

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

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4 mb-20 md:mb-4">
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
                <h2 className="text-2xl font-semibold mb-2 text-white">{planName}</h2>
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

const PricingCard: React.FC<{
  tier: PricingTier;
  isAnnual: boolean;
  delay: number;
}> = ({ tier, isAnnual, delay }) => {
  const { user } = useAuth();
  const monthlyPrice = isAnnual ? tier.price * 0.8 : tier.price;
  const navigate = useNavigate();

  const handleClick = () => {
    if (!user) {
      navigate('/signup');
      return;
    }

    if (tier.name === "Enterprise") {
      navigate('/contact');
      return;
    }

    const priceId = isAnnual ? tier.annualPriceId : tier.monthlyPriceId;
    // Navigate to the subscription checkout page with plan details and scroll to top
    window.scrollTo(0, 0);
    navigate(`/subscribe/${priceId}`, {
      state: {
        planName: tier.name,
        price: monthlyPrice,
        isAnnual
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`
        relative bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-full
        ${tier.popular ? 'border-2 border-primary-500' : 'border border-gray-200'}
      `}
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}

      <div className={`w-12 h-12 mb-6 flex items-center justify-center ${tier.color} rounded-xl`}>
        {tier.icon}
      </div>

      <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
      <p className="text-gray-600 mb-6">{tier.description}</p>

      <div className="mb-6">
        {tier.name === "Enterprise" ? (
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">Custom Pricing</p>
            <p className="text-sm text-gray-500 mt-1">Contact us for a custom quote</p>
          </div>
        ) : (
          <>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">${monthlyPrice}</span>
              <span className="text-gray-500 ml-2">/month</span>
            </div>
            {isAnnual && (
              <p className="text-sm text-gray-500 mt-1">
                Billed annually (${(monthlyPrice * 12).toFixed(0)}/year)
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-auto">
        {tier.name === "Enterprise" ? (
          <Link to="/contact">
            <Button
              variant="accent"
              fullWidth
              className="mb-2"
            >
              Contact Sales
            </Button>
          </Link>
        ) : (
          <Button
            variant={tier.popular ? "accent" : "outline"}
            fullWidth
            className="mb-2"
            onClick={handleClick}
          >
            {user ? "Subscribe Now" : "Get Started"}
          </Button>
        )}
      </div>

      <ul className="space-y-4 mb-8">
        {tier.features.map((feature, index) => (
          <motion.li
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: delay + (index * 0.1) }}
            className="flex items-start"
          >
            {feature.included ? (
              <CheckCircle size={20} className="text-primary-500 mr-3 flex-shrink-0 mt-0.5" />
            ) : (
              <X size={20} className="text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
            )}
            <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
              {feature.name}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
};

const Pricing: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const allFeatures = [
    "Up to 12 events per month",
    "Up to 30 events per month",
    "Unlimited events",
    "Booking management",
    "Chat enabled",
    "Payment processing",
    "Basic analytics",
    "Advanced analytics",
    "Financial reporting",
    "Social Post Accelerator",
    "Priority support",
    "Dedicated support team",
    "Custom integrations"
  ];

  const pricingTiers: PricingTier[] = [
    {
      name: "Starter",
      price: 20,
      description: "Perfect for individual creators and small events",
      icon: <Star size={24} />,
      color: "bg-primary-100 text-primary-600",
      monthlyPriceId: import.meta.env.VITE_STRIPE_STARTER_MONTHLY_PRICE_ID!,
      annualPriceId: import.meta.env.VITE_STRIPE_STARTER_ANNUAL_PRICE_ID!,
      features: allFeatures.filter(f => f !== "Up to 30 events per month" && f !== "Unlimited events").map(f => ({
        name: f,
        included: [
          "Up to 12 events per month",
          "Booking management",
          "Chat enabled",
          "Payment processing",
          "Basic analytics"
        ].includes(f)
      }))
    },
    {
      name: "Professional",
      price: 40,
      description: "Ideal for growing businesses and professional creators",
      icon: <Zap size={24} />,
      color: "bg-accent-100 text-accent-600",
      popular: true,
      monthlyPriceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID!,
      annualPriceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID!,
      features: allFeatures.filter(f => f !== "Up to 12 events per month" && f !== "Unlimited events").map(f => ({
        name: f,
        included: [
          "Up to 30 events per month",
          "Booking management",
          "Chat enabled",
          "Payment processing",
          "Basic analytics",
          "Advanced analytics",
          "Financial reporting",
          "Social Post Accelerator",
          "Priority support"
        ].includes(f)
      }))
    },
    {
      name: "Enterprise",
      price: 0,
      description: "Custom solutions for large organizations",
      icon: <Shield size={24} />,
      color: "bg-secondary-100 text-secondary-600",
      features: allFeatures.filter(f => f !== "Up to 12 events per month" && f !== "Up to 30 events per month").map(f => ({
        name: f,
        included: [
          "Unlimited events",
          "Booking management",
          "Chat enabled",
          "Payment processing",
          "Basic analytics",
          "Advanced analytics",
          "Financial reporting",
          "Social Post Accelerator",
          "Priority support",
          "Dedicated support team",
          "Custom integrations"
        ].includes(f)
      }))
    }
  ];

  return (
    <Elements stripe={stripePromise}>
      <div className="min-h-screen bg-gray-50 py-20">
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg')] bg-cover bg-center mix-blend-overlay opacity-20"></div>
          <div className="container-custom relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-gray-200 mb-8">
                Choose the perfect plan for your needs. All plans include a 14-day free trial.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <span className={`text-sm ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
                <button
                  onClick={() => setIsAnnual(!isAnnual)}
                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-700"
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition
                      ${isAnnual ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
                <span className={`text-sm ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
                  Annual <span className="text-accent-400">(Save 20%)</span>
                </span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-24">
          <div className="container-custom">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
              {pricingTiers.map((tier, index) => (
                <PricingCard
                  key={tier.name}
                  tier={tier}
                  isAnnual={isAnnual}
                  delay={index * 0.2}
                />
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-white">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-center mb-12">
                Frequently Asked Questions
              </h2>

              <div className="space-y-8">
                {[
                  {
                    question: "Can I change plans later?",
                    answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
                  },
                  {
                    question: "What payment methods do you accept?",
                    answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans."
                  },
                  {
                    question: "Is there a free trial?",
                    answer: "Yes, all plans include a 14-day free trial. No credit card required to start."
                  },
                  {
                    question: "What happens after my trial ends?",
                    answer: "After your trial, you'll be prompted to select a plan to continue using Earshot. Your data and settings will be preserved."
                  },
                  {
                    question: "Do you offer refunds?",
                    answer: "Yes, we offer a 30-day money-back guarantee for all paid plans."
                  },
                  {
                    question: "How do I get started with Enterprise?",
                    answer: "Contact our sales team to discuss your specific needs and get a custom quote tailored to your organization."
                  }
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="border-b border-gray-200 pb-8 last:border-0 last:pb-0"
                  >
                    <h3 className="text-xl font-semibold mb-4">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gray-50">
          <div className="container-custom">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of successful event organizers who trust Earshot
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link to="/signup">
                  <Button
                    variant="accent"
                    size="lg"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    size="lg"
                  >
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Elements>
  );
};

export default Pricing; 