import { supabase } from './supabase';
import { processTransfer, getOrCreateWallet } from './payments';

export interface PaymentRequest {
    merchantId: string;
    amount: number;
    description: string;
    orderId?: string;
    metadata?: any;
}

export const SetxPay = {
    /**
     * Initiates a payment request from a subdomain
     * This is intended to be called by the checkout logic on setx.io subdomains
     */
    requestPayment: async (request: PaymentRequest) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User must be authenticated to use SETX Pay');

        // 1. Get user wallet
        const userWallet = await getOrCreateWallet(user.id, 'personal');
        if (!userWallet) throw new Error('User wallet not found');

        // 2. Get merchant wallet
        const { data: merchant } = await supabase
            .from('merchants')
            .select('id, name, wallet_id')
            .eq('id', request.merchantId)
            .single();

        if (!merchant) throw new Error('Merchant not found');

        // 3. Check balance
        if (userWallet.balance < request.amount) {
            throw new Error('Insufficient SETX Credits (SEC)');
        }

        // 4. Record pending transaction (optional, for high-fidelity auditing)
        // ...

        return {
            status: 'ready',
            request,
            userWallet,
            merchant
        };
    },

    /**
     * Confirms and executes the payment
     */
    confirmPayment: async (request: PaymentRequest, userId: string) => {
        const userWallet = await getOrCreateWallet(userId, 'personal');
        const { data: merchant } = await supabase
            .from('merchants')
            .select('wallet_id, name')
            .eq('id', request.merchantId)
            .single();

        if (!userWallet || !merchant?.wallet_id) throw new Error('Payment bridge failed: Wallets not resolved');

        const result = await processTransfer({
            senderWalletId: userWallet.id,
            receiverWalletId: merchant.wallet_id,
            amount: request.amount,
            type: 'payment',
            description: request.description || `Purchase at ${merchant.name}`
        });

        return result;
    }
};
