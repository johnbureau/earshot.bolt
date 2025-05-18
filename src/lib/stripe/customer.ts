import Stripe from 'stripe';
import { supabase } from '../supabase';

// Initialize Stripe
const stripeKey = import.meta.env.VITE_STRIPE_SECRET_KEY;
if (!stripeKey) {
  console.error('Missing VITE_STRIPE_SECRET_KEY environment variable');
}

const stripe = stripeKey ? new Stripe(stripeKey, {
  apiVersion: '2023-10-16',
}) : null;

export class CustomerService {
  async createCustomer(userId: string, email: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      // Create a new customer in Stripe
      const customer = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });

      // Update the user's profile with the Stripe customer ID
      const { error: updateError } = await supabase
        .from('profilesv2')
        .update({ stripe_customer_id: customer.id })
        .eq('id', userId);

      if (updateError) {
        // If we fail to update the database, delete the customer from Stripe
        await stripe.customers.del(customer.id);
        throw updateError;
      }

      return customer;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      const customer = await stripe.customers.retrieve(customerId);
      return customer;
    } catch (error) {
      console.error('Error retrieving customer:', error);
      throw error;
    }
  }

  async updateCustomer(customerId: string, data: Stripe.CustomerUpdateParams) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      const customer = await stripe.customers.update(customerId, data);
      return customer;
    } catch (error) {
      console.error('Error updating customer:', error);
      throw error;
    }
  }

  async deleteCustomer(customerId: string) {
    if (!stripe) {
      throw new Error('Stripe is not initialized. Check your environment variables.');
    }

    try {
      await stripe.customers.del(customerId);
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  }
} 