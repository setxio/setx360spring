import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, 
    Lock, 
    Loader2, 
    CheckCircle2, 
    X,
    Wallet,
    ArrowRight
} from 'lucide-react';
import { SetxPay } from '../lib/setx-pay';
import type { PaymentRequest } from '../lib/setx-pay';
import './SetxCheckoutOverlay.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    request: PaymentRequest | null;
    onSuccess?: (txId: string) => void;
}

export const SetxCheckoutOverlay: React.FC<Props> = ({ isOpen, onClose, request, onSuccess }) => {
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleConfirm = async () => {
        if (!request) return;
        setStatus('processing');
        try {
            // In a real app, we'd get the user ID from the active session
            const { data: { user } } = await (await import('../lib/supabase')).supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const result = await SetxPay.confirmPayment(request, user.id);
            if (result.success) {
                setStatus('success');
                setTimeout(() => {
                    onSuccess?.(result.transactionGroupId);
                    onClose();
                }, 2000);
            } else {
                throw new Error(result.error as string);
            }
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message || 'Payment failed');
        }
    };

    if (!request) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="checkout-overlay-mask">
                    <motion.div 
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        className="checkout-sheet glass"
                    >
                        <header className="sheet-header">
                            <div className="security-tag">
                                <Lock size={12} />
                                <span>SETX PAY SECURE</span>
                            </div>
                            <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        </header>

                        {status === 'success' ? (
                            <div className="status-view success">
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="success-icon-box"
                                >
                                    <CheckCircle2 size={64} color="#10b981" />
                                </motion.div>
                                <h2>Payment Successful</h2>
                                <p>Your order at {request.description.split('at ')[1] || 'the merchant'} is confirmed.</p>
                            </div>
                        ) : (
                            <div className="payment-details">
                                <div className="merchant-info">
                                    <div className="m-avatar">
                                        <ShieldCheck size={24} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <h3 className="m-name">Regional Purchase</h3>
                                        <p className="m-desc">{request.description}</p>
                                    </div>
                                </div>

                                <div className="amount-display">
                                    <div className="a-label">Total to Pay</div>
                                    <div className="a-value">
                                        <span className="a-currency">SEC</span>
                                        <span className="a-num">{request.amount.toFixed(2)}</span>
                                    </div>
                                </div>

                                <div className="wallet-source">
                                    <Wallet size={18} />
                                    <span>Personal Wallet (SEC)</span>
                                    <div className="w-active">ACTIVE</div>
                                </div>

                                {status === 'error' && (
                                    <div className="error-banner">
                                        <p>{errorMsg}</p>
                                    </div>
                                )}

                                <footer className="sheet-footer">
                                    <button 
                                        className={`confirm-btn ${status === 'processing' ? 'loading' : ''}`}
                                        onClick={handleConfirm}
                                        disabled={status === 'processing'}
                                    >
                                        {status === 'processing' ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            <>
                                                Confirm Payment <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                    <p className="footer-note">By confirming, you authorize SETX to deduct credits from your regional wallet.</p>
                                </footer>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
