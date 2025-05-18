import Stripe from 'stripe';
import { supabase } from '../supabase';

// Initialize Stripe only if we have the key
const stripeKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('Missing VITE_STRIPE_SECRET_KEY environment variable');
}

const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
}) : null;

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  maxEvents: number;
}

class SubscriptionService {
  async createSubscription(userId: string, priceId: string, paymentMethodId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      // Get current session for user email
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.email) {
        console.error('Error fetching session:', sessionError);
        throw new Error('Could not fetch user email');
      }

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profilesv2')
        .select('stripe_customer_id')
        .eq('id', userId)
        .single();

      if (profileError && !profileError.message?.includes('does not exist')) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Could not fetch user profile');
      }

      let customerID = profile?.stripe_customer_id;

      // If no customer ID exists, create one
      if (!customerID) {
        try {
          const customer = await stripe.customers.create({
            email: session.user.email,
            metadata: {
              user_id: userId
            }
          });
          customerID = customer.id;

          // Update the user's profile with the new customer ID
          const { error: updateError } = await supabase
            .from('profilesv2')
            .update({ stripe_customer_id: customerID })
            .eq('id', userId);

          if (updateError) {
            console.error('Error updating profile with customer ID:', updateError);
            throw new Error('Could not update user profile with Stripe customer ID');
          }
        } catch (err) {
          console.error('Error creating Stripe customer:', err);
          throw new Error('Failed to create Stripe customer');
        }
      }

      try {
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerID,
        });
      } catch (attachError: any) {
        // If the payment method is already attached, continue
        if (!attachError.message?.includes('already been attached')) {
          throw attachError;
        }
      }

      // Set as default payment method
      await stripe.customers.update(customerID, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription with automatic tax and expanded payment intent
      const subscription = await stripe.subscriptions.create({
        customer: customerID,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          user_id: userId,
        },
      });

      // Store subscription in database
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerID,
          status: subscription.status,
          price_id: priceId,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

      return subscription;
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      // Add more context to verification errors
      if (error.message?.toLowerCase().includes('verification') || 
          error.message?.toLowerCase().includes('captcha') ||
          error.message?.toLowerCase().includes('authentication')) {
        throw new Error('Card requires verification. Please try again or use a different card.');
      }
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      // Update subscription in database
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          cancel_at_period_end: true,
        })
        .eq('stripe_subscription_id', subscriptionId);

      return subscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async updateSubscription(subscriptionId: string, newPriceId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'always_invoice',
      });

      // Update subscription in database
      await supabase
        .from('subscriptions')
        .update({
          price_id: newPriceId,
          status: updatedSubscription.status,
          current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId);

      return updatedSubscription;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  private async getCurrentMonthEventCount(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error } = await supabase
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (error) {
      console.error('Error counting events:', error);
      throw error;
    }

    return count || 0;
  }

  // Define tier limits
  private readonly TIER_LIMITS = {
    'starter': 12,
    'professional': 30,
    'enterprise': -1 // unlimited
  };

  private readonly TIER_DESCRIPTIONS = {
    'starter': 'Basic features with up to 12 events per month',
    'professional': 'Advanced features with up to 30 events per month',
    'enterprise': 'Unlimited events and premium features'
  };

  async getSubscription(subscriptionId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'latest_invoice', 'default_payment_method']
      });

      // Get the tier name from the product metadata
      const productId = subscription.items.data[0].price.product as string;
      const product = await stripe.products.retrieve(productId);
      const tierName = product.metadata.tier_name?.toLowerCase() || 'starter';
      
      // Get current event count
      const userId = subscription.metadata.user_id;
      const currentEventCount = await this.getCurrentMonthEventCount(userId);

      // Add tier information to the subscription object
      const enrichedSubscription = {
        ...subscription,
        tier: {
          name: tierName,
          description: this.TIER_DESCRIPTIONS[tierName as keyof typeof this.TIER_DESCRIPTIONS],
          event_limit: this.TIER_LIMITS[tierName as keyof typeof this.TIER_LIMITS],
          current_usage: currentEventCount
        }
      };

      return enrichedSubscription;
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      throw error;
    }
  }

  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      const prices = await stripe.prices.list({
        active: true,
        expand: ['data.product'],
      });

      return prices.data.map(price => ({
        id: price.id,
        name: (price.product as Stripe.Product).name,
        price: price.unit_amount! / 100,
        interval: price.recurring?.interval as 'month' | 'year',
        features: (price.product as Stripe.Product).features || [],
        maxEvents: (price.product as Stripe.Product).metadata.maxEvents 
          ? parseInt((price.product as Stripe.Product).metadata.maxEvents)
          : 0,
      }));
    } catch (error) {
      console.error('Error retrieving plans:', error);
      throw error;
    }
  }

  async getPaymentMethods(customerId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      const paymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      console.error('Error retrieving payment methods:', error);
      throw error;
    }
  }

  async updatePaymentMethod(customerId: string, paymentMethodId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      return true;
    } catch (error) {
      console.error('Error updating payment method:', error);
      throw error;
    }
  }

  async reactivateSubscription(subscriptionId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      });

      // Update subscription in database
      await supabase
        .from('subscriptions')
        .update({
          cancel_at_period_end: false,
        })
        .eq('stripe_subscription_id', subscriptionId);

      return subscription;
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      throw error;
    }
  }
}

export default SubscriptionService; 