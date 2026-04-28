import React, { useState } from 'react';
import { 
  ShoppingBag, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Database
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface StoreIntegrationsProps {
  store: any;
  onUpdate: () => void;
}

export const StoreIntegrations: React.FC<StoreIntegrationsProps> = ({ store, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [config, setConfig] = useState({
    type: store.integration_type || 'none',
    shopify_domain: store.integration_config?.shopify_domain || '',
    shopify_token: store.integration_config?.shopify_token || '',
    woo_url: store.integration_config?.woo_url || '',
    woo_key: store.integration_config?.woo_key || '',
    woo_secret: store.integration_config?.woo_secret || '',
    sync_inventory: store.integration_config?.sync_inventory ?? true,
    auto_publish: store.integration_config?.auto_publish ?? false,
  });

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('stores')
        .update({
          integration_type: config.type,
          integration_config: {
            shopify_domain: config.shopify_domain,
            shopify_token: config.shopify_token,
            woo_url: config.woo_url,
            woo_key: config.woo_key,
            woo_secret: config.woo_secret,
            sync_inventory: config.sync_inventory,
            auto_publish: config.auto_publish,
          }
        })
        .eq('id', store.id);

      if (error) throw error;
      setMessage({ type: 'success', text: 'Integration settings saved successfully.' });
      onUpdate();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncNow = async () => {
    if (config.type === 'none') return;
    
    setIsSyncing(true);
    setMessage(null);

    try {
      const { error } = await supabase.functions.invoke('sync-store-products', {
        body: { storeId: store.id }
      });
      
      if (error) throw error;
      
      setMessage({ type: 'success', text: 'Products and inventory synced successfully.' });
      onUpdate();
    } catch (err: any) {
      console.error('Sync error:', err);
      setMessage({ type: 'error', text: 'Sync failed: ' + (err.message || 'Check your API credentials.') });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="integrations-container">
      <div className="section-header">
        <div className="header-info">
          <h3>Store Integrations</h3>
          <p>Connect your existing e-commerce platform to automatically sync products and inventory.</p>
        </div>
        {config.type !== 'none' && (
          <button 
            className="sync-btn" 
            onClick={handleSyncNow} 
            disabled={isSyncing}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              borderRadius: '8px',
              background: 'var(--accent-bg)',
              color: 'var(--primary)',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        )}
      </div>

      <div className="integration-cards">
        <div 
          className={`integration-card ${config.type === 'shopify' ? 'active' : ''}`}
          onClick={() => setConfig({ ...config, type: 'shopify' })}
        >
          <div className="card-icon shopify">
            <ShoppingBag size={24} />
          </div>
          <div className="card-details">
            <h4>Shopify</h4>
            <span>Auto-sync products & stock</span>
          </div>
          <div className="status-indicator">
            {config.type === 'shopify' && <CheckCircle2 size={18} color="var(--primary)" />}
          </div>
        </div>

        <div 
          className={`integration-card ${config.type === 'woocommerce' ? 'active' : ''}`}
          onClick={() => setConfig({ ...config, type: 'woocommerce' })}
        >
          <div className="card-icon woocommerce">
            <ShoppingBag size={24} />
          </div>
          <div className="card-details">
            <h4>WooCommerce</h4>
            <span>Connect via REST API</span>
          </div>
          <div className="status-indicator">
            {config.type === 'woocommerce' && <CheckCircle2 size={18} color="var(--primary)" />}
          </div>
        </div>

        <div 
          className={`integration-card ${config.type === 'none' ? 'active' : ''}`}
          onClick={() => setConfig({ ...config, type: 'none' })}
        >
          <div className="card-icon none">
            <Database size={24} />
          </div>
          <div className="card-details">
            <h4>Native</h4>
            <span>Manual product management</span>
          </div>
          <div className="status-indicator">
            {config.type === 'none' && <CheckCircle2 size={18} color="var(--primary)" />}
          </div>
        </div>
      </div>

      {config.type === 'shopify' && (
        <div className="config-form fade-in">
          <div className="input-group">
            <label>Shopify Domain</label>
            <input 
              type="text" 
              placeholder="your-store.myshopify.com"
              value={config.shopify_domain}
              onChange={e => setConfig({ ...config, shopify_domain: e.target.value })}
            />
          </div>
          <div className="input-group">
            <label>Admin API Access Token</label>
            <input 
              type="password" 
              placeholder="shpat_xxxxxxxxxxxxxxxx"
              value={config.shopify_token}
              onChange={e => setConfig({ ...config, shopify_token: e.target.value })}
            />
            <p className="helper-text">Create a Custom App in Shopify Admin {'>'} Settings {'>'} App and sales channels.</p>
          </div>
        </div>
      )}

      {config.type === 'woocommerce' && (
        <div className="config-form fade-in">
          <div className="input-group">
            <label>Store URL</label>
            <input 
              type="text" 
              placeholder="https://yourstore.com"
              value={config.woo_url}
              onChange={e => setConfig({ ...config, woo_url: e.target.value })}
            />
          </div>
          <div className="input-grid">
            <div className="input-group">
              <label>Consumer Key</label>
              <input 
                type="text" 
                placeholder="ck_xxxxxxxx"
                value={config.woo_key}
                onChange={e => setConfig({ ...config, woo_key: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Consumer Secret</label>
              <input 
                type="password" 
                placeholder="cs_xxxxxxxx"
                value={config.woo_secret}
                onChange={e => setConfig({ ...config, woo_secret: e.target.value })}
              />
            </div>
          </div>
          <p className="helper-text">Generate these in WooCommerce {'>'} Settings {'>'} Advanced {'>'} REST API.</p>
        </div>
      )}

      {config.type !== 'none' && (
        <div className="automation-settings">
          <div className="toggle-item">
            <div className="toggle-info">
              <h5>Sync Inventory Automatically</h5>
              <p>Keep stock quantities in sync between platforms.</p>
            </div>
            <input 
              type="checkbox" 
              checked={config.sync_inventory}
              onChange={e => setConfig({ ...config, sync_inventory: e.target.checked })}
            />
          </div>
          <div className="toggle-item">
            <div className="toggle-info">
              <h5>Auto-Publish New Products</h5>
              <p>Immediately list new source products on SETX 360.</p>
            </div>
            <input 
              type="checkbox" 
              checked={config.auto_publish}
              onChange={e => setConfig({ ...config, auto_publish: e.target.checked })}
            />
          </div>
        </div>
      )}

      {message && (
        <div className={`status-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="form-actions">
        <button 
          className="primary-btn" 
          onClick={handleSave} 
          disabled={isLoading}
          style={{ width: '100%', marginTop: '24px' }}
        >
          {isLoading ? <RefreshCw className="animate-spin" /> : 'Save Integration Settings'}
        </button>
      </div>

      <style>{`
        .integrations-container {
          padding: 24px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .header-info h3 {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .header-info p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .integration-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }
        .integration-card {
          background: var(--bg-soft);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        .integration-card:hover {
          border-color: var(--primary);
          background: var(--accent-bg);
        }
        .integration-card.active {
          border-color: var(--primary);
          background: var(--accent-bg);
          box-shadow: 0 0 15px rgba(37, 99, 235, 0.1);
        }
        .card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }
        .card-icon.shopify { background: #95bf4722; color: #95bf47; }
        .card-icon.woocommerce { background: #96588a22; color: #96588a; }
        .card-icon.none { background: rgba(255,255,255,0.05); color: var(--text-muted); }
        .card-details h4 {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .card-details span {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .status-indicator {
          position: absolute;
          top: 12px;
          right: 12px;
        }
        .config-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px;
          background: rgba(255,255,255,0.02);
          border-radius: 16px;
          margin-bottom: 24px;
        }
        .input-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .helper-text {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: -8px;
        }
        .automation-settings {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .toggle-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: rgba(255,255,255,0.02);
          border-radius: 12px;
        }
        .toggle-info h5 {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 2px;
        }
        .toggle-info p {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .status-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 10px;
          margin-top: 24px;
          font-size: 0.85rem;
        }
        .status-banner.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .status-banner.error { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
      `}</style>
    </div>
  );
};
