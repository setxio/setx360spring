import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  Plus, 
  CreditCard, 
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Zap,
  ShoppingBag,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getOrCreateWallet, processTransfer } from '../lib/payments';
import './WalletView.css';

export const WalletView: React.FC<{ activeTab?: number; user?: any; scope?: string }> = ({ activeTab = 0, user }) => {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transfer State
  const [transferReceiver, setTransferReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  useEffect(() => {
    if (user) {
      initializeWallet();
    }
  }, [user]);

  const initializeWallet = async () => {
    setIsLoading(true);
    const userWallet = await getOrCreateWallet(user.id, 'personal');
    if (userWallet) {
      setWallet(userWallet);
      await fetchTransactions(userWallet.id);
    }
    setIsLoading(false);
  };

  const fetchTransactions = async (walletId: string) => {
    const { data } = await supabase
      .from('fintech_ledger')
      .select('*')
      .eq('wallet_id', walletId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setTransactions(data);
    }
  };

  const handleTransfer = async () => {
    setTransferError('');
    setTransferSuccess('');
    if (!transferReceiver || !transferAmount || isNaN(Number(transferAmount))) {
      setTransferError('Please enter a valid receiver and amount.');
      return;
    }

    const amount = Number(transferAmount);
    if (amount <= 0 || amount > wallet.balance) {
      setTransferError('Invalid amount or insufficient funds.');
      return;
    }

    setIsTransferring(true);

    // 1. Find receiver by email or exact name (simplified for demo)
    const { data: receiverProfile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('email', transferReceiver)
      .single();

    if (!receiverProfile) {
      setTransferError('Receiver not found.');
      setIsTransferring(false);
      return;
    }

    // 2. Get/Create receiver wallet
    const receiverWallet = await getOrCreateWallet(receiverProfile.id);
    if (!receiverWallet) {
      setTransferError('Failed to locate receiver wallet.');
      setIsTransferring(false);
      return;
    }

    // 3. Process Transfer via RPC
    const result = await processTransfer({
      senderWalletId: wallet.id,
      receiverWalletId: receiverWallet.id,
      amount,
      type: 'payment',
      description: `P2P Transfer to ${receiverProfile.name}`
    });

    setIsTransferring(false);

    if (result.success) {
      setTransferSuccess(`Successfully sent ${amount} SEC to ${receiverProfile.name}`);
      setTransferAmount('');
      setTransferReceiver('');
      // Refresh wallet balance
      initializeWallet();
    } else {
      setTransferError(result.error as string);
    }
  };

  const renderHome = () => (
    <div className="wallet-content fade-in">
      {/* Main Balance Card */}
      <section className="balance-section">
        <div className="balance-card glass">
          <div className="balance-bg-bloom"></div>
          <div className="balance-header">
            <div className="balance-label">
              <Wallet size={16} />
              <span>Available Balance</span>
            </div>
            <ShieldCheck size={20} className="secure-icon" />
          </div>
          <div className="balance-amount">
            <span className="currency">SEC</span>
            <span className="value">
              {isLoading ? <Loader2 className="animate-spin" size={32} /> : Number(wallet?.balance || 0).toFixed(2)}
            </span>
          </div>
          <div className="balance-footer">
            <div className="balance-change positive">
              <TrendingUp size={14} />
              <span>SEC Wallet Active</span>
            </div>
            <div className="card-number">•••• {user?.id?.substring(0, 4)}</div>
          </div>
        </div>

        <div className="quick-actions">
          <button className="action-btn glass">
            <div className="action-icon send"><ArrowUpRight size={24} /></div>
            <span>Send</span>
          </button>
          <button className="action-btn glass">
            <div className="action-icon receive"><ArrowDownLeft size={24} /></div>
            <span>Receive</span>
          </button>
          <button className="action-btn glass">
            <div className="action-icon topup"><Plus size={24} /></div>
            <span>Top Up</span>
          </button>
          <button className="action-btn glass">
            <div className="action-icon swap"><RefreshCw size={24} /></div>
            <span>Swap</span>
          </button>
        </div>
      </section>

      {/* Activity Summary */}
      <section className="wallet-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <button className="text-btn">View All</button>
        </div>
        <div className="transaction-list">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 20 }}><Loader2 className="animate-spin" size={24} /></div>
          ) : transactions.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: 20, opacity: 0.7 }}>
              No transactions yet.
            </div>
          ) : transactions.map(tx => {
            const isDebit = tx.amount < 0;
            return (
              <div key={tx.id} className="transaction-item glass">
                <div className="tx-icon" style={{ background: isDebit ? '#ef444415' : '#10b98115', color: isDebit ? '#ef4444' : '#10b981' }}>
                  {isDebit ? <ShoppingBag size={18} /> : <Zap size={18} />}
                </div>
                <div className="tx-info">
                  <h4>{tx.description || tx.type.toUpperCase()}</h4>
                  <p>{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <div className={`tx-amount ${isDebit ? 'sent' : 'received'}`} style={{ color: isDebit ? '#ef4444' : '#10b981' }}>
                  {isDebit ? '' : '+'}{Number(tx.amount).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );

  const renderPay = () => (
    <div className="wallet-content fade-in">
      <div className="section-header">
        <h2>Transfer SEC</h2>
        <p style={{ color: 'var(--text-muted)' }}>Send zero-fee internal credits instantly.</p>
      </div>
      <div className="transfer-card glass" style={{ padding: 24 }}>
        <div className="t-input-group" style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Receiver Email</label>
          <div className="t-input" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--glass-border)' }}>
            <Plus size={18} style={{ marginRight: 8, color: 'var(--primary)' }} />
            <input 
              type="text" 
              placeholder="user@example.com" 
              value={transferReceiver}
              onChange={e => setTransferReceiver(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', width: '100%', outline: 'none' }}
            />
          </div>
        </div>
        <div className="t-input-group" style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Amount (SEC)</label>
          <div className="t-amount-input" style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 16px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontWeight: 700, color: 'var(--accent)', marginRight: 8 }}>SEC</span>
            <input 
              type="number" 
              placeholder="0.00" 
              value={transferAmount}
              onChange={e => setTransferAmount(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '1.2rem', fontWeight: 600 }}
            />
          </div>
        </div>
        
        {transferError && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: '0.85rem' }}>{transferError}</div>}
        {transferSuccess && <div style={{ color: '#10b981', marginBottom: 16, fontSize: '0.85rem' }}>{transferSuccess}</div>}

        <button 
          className="primary-btn" 
          style={{ width: '100%', padding: 16 }}
          onClick={handleTransfer}
          disabled={isTransferring}
        >
          {isTransferring ? <Loader2 className="animate-spin" /> : 'Send Credits'}
        </button>
      </div>
    </div>
  );

  const renderCards = () => (
    <div className="wallet-content fade-in">
      <div className="section-header">
        <h2>Payment Methods</h2>
        <button className="add-method" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 20 }}>Add New</button>
      </div>
      <div className="payment-methods" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="method-card glass" style={{ display: 'flex', alignItems: 'center', padding: 20, gap: 16, border: '1px solid var(--primary)' }}>
          <div className="method-icon" style={{ background: 'rgba(99,102,241,0.2)', padding: 12, borderRadius: 12 }}><Wallet size={24} color="var(--primary)" /></div>
          <div className="method-info" style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0' }}>Internal Credits (SEC)</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Zero-fee platform native currency</p>
          </div>
          <div className="m-active" style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--primary)', padding: '4px 10px', borderRadius: 12 }}>ACTIVE</div>
        </div>
        <div className="method-card glass" style={{ display: 'flex', alignItems: 'center', padding: 20, gap: 16 }}>
          <div className="method-icon" style={{ background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 12 }}><CreditCard size={24} /></div>
          <div className="method-info" style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0' }}>Bank Account (ACH)</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Link bank via Plaid to deposit funds</p>
          </div>
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );

  const content = () => {
    switch (activeTab) {
      case 0: return renderHome();
      case 1: return renderPay();
      case 3: return renderCards();
      default: return renderHome();
    }
  };

  return (
    <div className="wallet-container">
      <header className="wallet-header">
        <h1>Digital Wallet</h1>
        <p>Manage your platform credits and local payments.</p>
      </header>
      {content()}
    </div>
  );
};
