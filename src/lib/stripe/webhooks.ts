import Stripe from 'stripe';
import { supabaseAdmin } from '../supabase';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function handleStripeWebhook(event: Stripe.Event) {
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handleSuccessfulPayment(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleFailedPayment(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    throw error;
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const { data: profile } = await supabaseAdmin
    .from('profilesv2')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (!profile) {
    throw new Error('User not found for subscription update');
  }

  await supabaseAdmin
    .from('subscriptions')
    .upsert({
      user_id: profile.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const { data: profile } = await supabaseAdmin
    .from('profilesv2')
    .select('id')
    .eq('stripe_customer_id', subscription.customer)
    .single();

  if (!profile) {
    throw new Error('User not found for subscription cancellation');
  }

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id);
}

async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  const { data: profile } = await supabaseAdmin
    .from('profilesv2')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .single();

  if (!profile) {
    throw new Error('User not found for payment success');
  }

  await supabaseAdmin
    .from('payments')
    .insert({
      user_id: profile.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      invoice_id: invoice.id,
    });
}

async function handleFailedPayment(invoice: Stripe.Invoice) {
  const { data: profile } = await supabaseAdmin
    .from('profilesv2')
    .select('id')
    .eq('stripe_customer_id', invoice.customer)
    .single();

  if (!profile) {
    throw new Error('User not found for failed payment');
  }

  await supabaseAdmin
    .from('payments')
    .insert({
      user_id: profile.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      invoice_id: invoice.id,
    });

  // Notify user of failed payment
  await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: profile.id,
      type: 'payment_failed',
      message: 'Your recent payment has failed. Please update your payment method.',
    });
} 