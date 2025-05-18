import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import SubscriptionService, { SubscriptionPlan } from '../lib/stripe/subscription';
import { supabase } from '../lib/supabase';

interface SubscriptionContextType {
  subscription: any | null;
  loading: boolean;
  error: string | null;
  plans: SubscriptionPlan[];
  createSubscription: (priceId: string, paymentMethodId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  updateSubscription: (newPriceId: string) => Promise<void>;
  updatePaymentMethod: (paymentMethodId: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  reactivateSubscription: (subscriptionId: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const subscriptionService = new SubscriptionService();

  useEffect(() => {
    console.log('SubscriptionProvider mounted');
    console.log('User:', user);
    
    if (user) {
      refreshSubscription().catch(err => {
        console.error('Error in initial subscription refresh:', err);
        setError('Failed to load subscription data');
      });
      loadPlans().catch(err => {
        console.error('Error loading plans:', err);
        setError('Failed to load subscription plans');
      });
    } else {
      console.log('No user, clearing subscription state');
      setSubscription(null);
      setLoading(false);
    }
  }, [user]);

  const loadPlans = async () => {
    try {
      console.log('Loading plans...');
      const availablePlans = await subscriptionService.getAvailablePlans();
      console.log('Plans loaded:', availablePlans);
      setPlans(availablePlans);
    } catch (err) {
      console.error('Error in loadPlans:', err);
      setError('Failed to load subscription plans');
      throw err;
    }
  };

  const refreshSubscription = async () => {
    if (!user) {
      console.log('No user, skipping subscription refresh');
      return;
    }

    console.log('Refreshing subscription for user:', user.id);
    setLoading(true);
    setError(null);

    try {
      const { data: userSubscription, error: supabaseError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw supabaseError;
      }

      console.log('User subscription from Supabase:', userSubscription);

      if (userSubscription) {
        const stripeSubscription = await subscriptionService.getSubscription(
          userSubscription.stripe_subscription_id
        );
        console.log('Stripe subscription:', stripeSubscription);
        setSubscription(stripeSubscription);
      } else {
        console.log('No subscription found for user');
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error in refreshSubscription:', err);
      setError('Failed to load subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (priceId: string, paymentMethodId: string) => {
    if (!user) throw new Error('User must be logged in');

    setLoading(true);
    setError(null);

    try {
      await subscriptionService.createSubscription(user.id, priceId, paymentMethodId);
      await refreshSubscription();
    } catch (err) {
      setError('Failed to create subscription');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) throw new Error('No active subscription');

    setLoading(true);
    setError(null);

    try {
      await subscriptionService.cancelSubscription(subscription.id);
      await refreshSubscription();
    } catch (err) {
      setError('Failed to cancel subscription');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSubscription = async (newPriceId: string) => {
    if (!subscription) throw new Error('No active subscription');

    setLoading(true);
    setError(null);

    try {
      await subscriptionService.updateSubscription(subscription.id, newPriceId);
      await refreshSubscription();
    } catch (err) {
      setError('Failed to update subscription');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async (paymentMethodId: string) => {
    if (!user) throw new Error('User must be logged in');

    setLoading(true);
    setError(null);

    try {
      await subscriptionService.updatePaymentMethod(user.stripe_customer_id, paymentMethodId);
      await refreshSubscription();
    } catch (err) {
      setError('Failed to update payment method');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reactivateSubscription = async (subscriptionId: string) => {
    if (!subscription) throw new Error('No active subscription');

    setLoading(true);
    setError(null);

    try {
      await subscriptionService.reactivateSubscription(subscriptionId);
      await refreshSubscription();
    } catch (err) {
      setError('Failed to reactivate subscription');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    subscription,
    loading,
    error,
    plans,
    createSubscription,
    cancelSubscription,
    updateSubscription,
    updatePaymentMethod,
    refreshSubscription,
    reactivateSubscription,
  };

  console.log('SubscriptionContext value:', value);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
} 