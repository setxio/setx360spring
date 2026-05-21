import { supabase } from './supabase';
import { loadStripe } from '@stripe/stripe-js';

/**
 * SETX Multi-Platform Stripe Initialization
 * Dynamically loads the correct Stripe public key based on the platform slug.
 */
const getPlatformSlug = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('setx.io')) return 'setxio';
  }
  return 'setx360';
};

let stripePromiseCache: Promise<any> | null = null;

export const getStripe = async () => {
  if (stripePromiseCache) return stripePromiseCache;
  
  const slug = getPlatformSlug();
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('platform_public_key')
    .eq('slug', slug)
    .single();
    
  const key = settings?.platform_public_key || 'pk_test_TYooMQauvdEDq54NiTphI7jx';
  stripePromiseCache = loadStripe(key);
  return stripePromiseCache;
};


export type FintechTransactionType = 'payment' | 'deposit' | 'withdrawal' | 'refund' | 'fee';

export interface TransferParams {
  senderWalletId: string;
  receiverWalletId: string;
  amount: number;
  type: FintechTransactionType;
  description: string;
  referenceId?: string;
}

/**
 * SETX Fintech: Retrieves or creates a digital wallet for the given profile/entity.
 */
export const getOrCreateWallet = async (ownerId: string, walletType: 'personal' | 'business' | 'civic' | 'system' = 'personal') => {
  try {
    // Attempt to fetch existing wallet
    const { data: existingWallet } = await supabase
      .from('fintech_wallets')
      .select('*')
      .eq('owner_id', ownerId)
      .single();

    if (existingWallet) return existingWallet;
    
    // Create new wallet if none exists
    const { data: newWallet, error: createError } = await supabase
      .from('fintech_wallets')
      .insert([{ owner_id: ownerId, wallet_type: walletType, balance: 0.00 }])
      .select()
      .single();

    if (createError) throw createError;
    return newWallet;
  } catch (error) {
    console.error('Wallet Error:', error);
    return null;
  }
};

/**
 * SETX Fintech: Executes an atomic, double-entry transfer via Secure RPC.
 */
export const processTransfer = async (params: TransferParams) => {
  try {
    const { data, error } = await supabase.rpc('transfer_funds', {
      sender_wallet_id: params.senderWalletId,
      receiver_wallet_id: params.receiverWalletId,
      transfer_amount: params.amount,
      transfer_type: params.type,
      transfer_description: params.description,
      reference: params.referenceId || null
    });

    if (error) throw error;
    
    if (data && data.success) {
      return { success: true as const, transactionGroupId: data.transaction_group_id as string, newBalance: data.sender_new_balance as number };
    } else {
      return { success: false as const, error: (data?.error || 'Unknown transfer error') as string };
    }
  } catch (error: any) {
    console.error('Transfer Error:', error);
    return { success: false as const, error: error.message || 'Transfer failed' };
  }
};

/**
 * Utility Payment Helper (Uses System Wallet for City Revenue)
 * Assuming a static UUID for the "City Revenue System Wallet" for MVP
 */
const CITY_REVENUE_WALLET_ID = '00000000-0000-0000-0000-000000000000'; // Replace with real UUID

export const payUtilityBill = async (userId: string, amount: number, accountNumber: string) => {
  const userWallet = await getOrCreateWallet(userId, 'personal');
  if (!userWallet) return { success: false, error: 'User wallet not found' };

  return processTransfer({
    senderWalletId: userWallet.id,
    receiverWalletId: CITY_REVENUE_WALLET_ID,
    amount,
    type: 'payment',
    description: `Utility Payment: Acct ${accountNumber}`,
    referenceId: accountNumber
  });
};

/**
 * Ad Credit Purchase Helper (Uses System Wallet for Ads Revenue)
 */
const PLATFORM_REVENUE_WALLET_ID = '11111111-1111-1111-1111-111111111111'; // Replace with real UUID

export const buyAdCredits = async (userId: string, amount: number) => {
  const userWallet = await getOrCreateWallet(userId, 'business');
  if (!userWallet) return { success: false, error: 'User wallet not found' };

  return processTransfer({
    senderWalletId: userWallet.id,
    receiverWalletId: PLATFORM_REVENUE_WALLET_ID,
    amount,
    type: 'payment',
    description: `Ad Credits Purchase: $${amount}`
  });
};

/**
 * STRIPE CONNECT: Split Payment Handler
 * This function routes external credit card payments through Stripe Connect,
 * splitting the funds between the Vendor, Delivery Driver, and Platform.
 */
export const processStripeSplitPayment = async (
  amount: number, 
  vendorId: string,
  vendorStripeAccountId: string, 
  driverId?: string,
  driverStripeAccountId?: string
) => {
  try {
    // 1. Initialize Dynamic Stripe
    const stripe = await getStripe();
    const slug = getPlatformSlug();

    // 2. Fetch Dynamic Platform Settings
    const { data: settings, error: settingsError } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('slug', slug)
      .single();

    if (settingsError || !settings) {
      throw new Error('Failed to retrieve platform fee configuration.');
    }

    // 2. Fetch Custom Fee Overrides from Profiles
    const { data: vendorProfile } = await supabase.from('profiles').select('custom_fee_percentage, custom_base_fee').eq('id', vendorId).single();
    
    let driverProfile = null;
    if (driverId) {
      const { data } = await supabase.from('profiles').select('custom_fee_percentage, custom_base_fee').eq('id', driverId).single();
      driverProfile = data;
    }

    // Determine final percentages (Custom override vs Global setting)
    const finalVendorFee = vendorProfile?.custom_fee_percentage ?? settings.vendor_fee_percentage;
    const finalDriverFee = driverProfile?.custom_fee_percentage ?? settings.driver_fee_percentage;

    const vendorPct = (1 - finalVendorFee - (driverStripeAccountId ? finalDriverFee : 0)) * 100;
    const vendorFeeStr = (finalVendorFee * 100).toFixed(1);
    const driverFeeStr = (finalDriverFee * 100).toFixed(1);
    
    // In a real implementation, this calls a Supabase Edge Function:
    // const { data } = await supabase.functions.invoke('create-checkout-session', { amount, vendorStripeAccountId, ... })
    // await stripe?.redirectToCheckout({ sessionId: data.id });
    
    console.log(`[STRIPE SDK INITIALIZED]`, stripe);
    console.log(`[STRIPE CONNECT STUB] Routing $${amount} payment.`);
    console.log(`Vendor (${vendorStripeAccountId}) gets ${vendorPct.toFixed(1)}%`);
    if (driverStripeAccountId) console.log(`Driver (${driverStripeAccountId}) gets ${driverFeeStr}%`);
    console.log(`Platform keeps ${vendorFeeStr}% application fee (plus driver fee if applicable).`);
    
    return { success: true, message: 'Redirecting to Stripe Checkout...' };
  } catch (error) {
    console.error('Stripe Error:', error);
    return { success: false, error };
  }
};

/**
 * STRIPE & SEC REFUND HANDLER
 * Handles reversing a transaction either internally (SEC) or via Stripe API.
 */
export const processRefund = async (orderId: string, amount?: number) => {
  try {
    // 1. Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, stores(owner_id)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) throw new Error('Order not found');

    // 2. Check refund window (Priority: Store Policy -> Platform Policy)
    const slug = getPlatformSlug();
    const { data: settings } = await supabase.from('platform_settings').select('*').eq('slug', slug).single();
    const { data: store } = await supabase.from('stores').select('is_refunds_enabled, refund_window_days').eq('id', order.store_id).single();

    const isRefundsEnabled = store?.is_refunds_enabled ?? settings?.is_refunds_enabled ?? true;
    const refundWindow = store?.refund_window_days ?? settings?.refund_window_days ?? 30;

    const orderDate = new Date(order.created_at);
    const now = new Date();
    const daysSinceOrder = (now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24);

    if (!isRefundsEnabled) throw new Error('Refunds are currently disabled for this merchant.');
    if (daysSinceOrder > refundWindow) {
      throw new Error(`Refund window (${refundWindow} days) has expired for this store.`);
    }

    const refundAmount = amount || order.amount;

    if (order.payment_method === 'stripe') {
      console.log(`[STRIPE REFUND STUB] Initiating refund for ${order.stripe_payment_intent_id} of $${refundAmount}`);
      // In production: const refund = await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id, amount: refundAmount * 100 });
    }

    // 3. SEC Wallet Reversal (Internal Ledger)
    // We need the vendor wallet and customer wallet
    const vendorWallet = await getOrCreateWallet(order.stores.owner_id, 'business');
    const customerWallet = await getOrCreateWallet(order.customer_id, 'personal');

    if (!vendorWallet || !customerWallet) throw new Error('Wallet not found for refund');

    const transfer = await processTransfer({
      senderWalletId: vendorWallet.id,
      receiverWalletId: customerWallet.id,
      amount: refundAmount,
      type: 'refund',
      description: `Refund for Order #${orderId.slice(0, 8)}`,
      referenceId: orderId
    });

    if (transfer.success) {
      await supabase.from('orders').update({ status: 'refunded' }).eq('id', orderId);
      return { success: true, message: 'Refund processed successfully.' };
    } else {
      return { success: false, error: transfer.error };
    }

  } catch (error: any) {
    console.error('Refund Error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * CIRCULAR MICRO-ECONOMY: B2B Transfer Handler
 * Allows a merchant (business wallet) to directly pay another merchant (business wallet).
 */
export const b2bTransfer = async (senderOwnerId: string, receiverOwnerId: string, amount: number, description: string) => {
  const senderWallet = await getOrCreateWallet(senderOwnerId, 'business');
  const receiverWallet = await getOrCreateWallet(receiverOwnerId, 'business');
  
  if (!senderWallet || !receiverWallet) {
    return { success: false, error: 'One or both merchant wallets not found.' };
  }

  return processTransfer({
    senderWalletId: senderWallet.id,
    receiverWalletId: receiverWallet.id,
    amount,
    type: 'payment',
    description: description || 'B2B Mesh Network Transfer'
  });
};


