import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Truck, 
  MapPin, 
  ChevronRight, 
  ChevronLeft, 
  Clock,
  ShoppingBag,
  History
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image_url?: string;
}

interface VendorItem {
  store_id: string;
  store_name?: string;
  items: OrderItem[];
  subtotal: number;
  fulfillment_type: 'delivery' | 'pickup' | 'shipping' | 'dine_in';
  status: string;
}

interface Order {
  id: string;
  created_at: string;
  amount: number;
  status: string;
  delivery_status?: string;
  vendor_line_items: VendorItem[];
}

const OrdersView: React.FC = () => {
  const { user } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  const activeOrders = orders.filter(o => ['pending', 'processing'].includes(o.status));
  const historicalOrders = orders.filter(o => !['pending', 'processing'].includes(o.status));

  const localDeliveryOrders = orders.filter(o => 
    o.vendor_line_items?.some(v => v.fulfillment_type === 'delivery') && 
    !['completed', 'cancelled'].includes(o.status)
  );

  const pickupOrders = orders.filter(o => 
    o.vendor_line_items?.some(v => v.fulfillment_type === 'pickup') && 
    !['completed', 'cancelled'].includes(o.status)
  );

  const shippingOrders = orders.filter(o => 
    o.vendor_line_items?.some(v => v.fulfillment_type === 'shipping') && 
    !['completed', 'cancelled'].includes(o.status)
  );

  const renderOrderCard = (order: Order) => {
    const firstVendor = order.vendor_line_items?.[0];
    const firstItem = firstVendor?.items?.[0];

    return (
      <div key={order.id} className="p-4 mb-4" style={{
        background: '#050505',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '16px',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
              {firstItem?.image_url ? (
                <img src={firstItem.image_url} alt={firstItem.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="text-purple-400" size={24} />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-white/90">{firstVendor?.store_name || 'Merchant'}</h4>
              <p className="text-sm text-white/40">
                {firstVendor?.fulfillment_type === 'delivery' ? 'Local Delivery' :
                 firstVendor?.fulfillment_type === 'pickup' ? 'Curbside Pickup' :
                 firstVendor?.fulfillment_type === 'shipping' ? 'Shipping' : 'Order'}
                {' • '}<span style={{ color: 'var(--primary)', fontWeight: 600 }}>{order.status}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-purple-400 font-bold">${order.amount.toFixed(2)}</span>
            <p className="text-xs text-white/30">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-24 pt-4" style={{ color: '#fff' }}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Orders</h1>
          <p className="text-white/50">Track and manage your purchases</p>
        </div>
        <div className="p-3 rounded-full border" style={{ background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
          <ShoppingBag className="text-purple-400" size={24} />
        </div>
      </div>

      {/* Local Delivery Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="text-blue-400" size={20} />
          <h2 className="text-xl font-semibold text-white/90">Local Delivery</h2>
        </div>
        {localDeliveryOrders.length > 0 ? (
          localDeliveryOrders.map(renderOrderCard)
        ) : (
          <div className="p-8 text-center" style={{ background: '#050505', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
            <p className="text-white/30">No active local deliveries</p>
          </div>
        )}
      </section>

      {/* Pickup Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="text-orange-400" size={20} />
          <h2 className="text-xl font-semibold text-white/90">Pickup</h2>
        </div>
        {pickupOrders.length > 0 ? (
          pickupOrders.map(renderOrderCard)
        ) : (
          <div className="p-8 text-center" style={{ background: '#050505', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
            <p className="text-white/30">No active pickups scheduled</p>
          </div>
        )}
      </section>

      {/* Shipping Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Package className="text-green-400" size={20} />
          <h2 className="text-xl font-semibold text-white/90">Shipping</h2>
        </div>
        {shippingOrders.length > 0 ? (
          shippingOrders.map(renderOrderCard)
        ) : (
          <div className="p-8 text-center" style={{ background: '#050505', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '20px' }}>
            <p className="text-white/30">No packages currently in transit</p>
          </div>
        )}
      </section>

      {/* All Orders Section */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <History className="text-purple-400" size={20} />
          <h2 className="text-xl font-semibold text-white/90">All Orders</h2>
        </div>

        {/* Active Orders Carousel */}
        {activeOrders.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-4">Active Orders</h3>
            <div className="relative group">
              <div className="overflow-hidden rounded-3xl border" style={{ 
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05))',
                borderColor: 'rgba(139, 92, 246, 0.2)'
              }}>
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={activeCarouselIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-8 flex flex-col md:flex-row items-center gap-8"
                  >
                    <div className="w-full md:w-1/3 aspect-square rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl" style={{ background: '#050505' }}>
                      {activeOrders[activeCarouselIndex].vendor_line_items?.[0]?.items?.[0]?.image_url ? (
                        <img 
                          src={activeOrders[activeCarouselIndex].vendor_line_items[0].items[0].image_url} 
                          alt="Order item" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={64} className="text-purple-500/20" />
                      )}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                        <span className="px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-bold uppercase">
                          {activeOrders[activeCarouselIndex].status}
                        </span>
                        <span className="text-white/50 text-sm">
                          {activeOrders[activeCarouselIndex].vendor_line_items?.[0]?.fulfillment_type}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {activeOrders[activeCarouselIndex].vendor_line_items?.[0]?.store_name || 'Merchant Order'}
                      </h3>
                      <p className="text-white/40 mb-6">
                        {activeOrders[activeCarouselIndex].vendor_line_items?.[0]?.items?.length || 0} items in this order.
                      </p>
                      <button className="bg-white text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 mx-auto md:mx-0 hover:bg-gray-100 transition-colors">
                        View Details <ChevronRight size={18} />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {activeOrders.length > 1 && (
                <>
                  <button 
                    onClick={() => setActiveCarouselIndex((prev) => (prev - 1 + activeOrders.length) % activeOrders.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={() => setActiveCarouselIndex((prev) => (prev + 1) % activeOrders.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/80 border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Historical Orders */}
        <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">Order History</h3>
        {historicalOrders.length > 0 ? (
          <div className="grid gap-4">
            {historicalOrders.map(renderOrderCard)}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10" style={{ background: '#050505' }}>
              <Clock className="text-white/20" size={32} />
            </div>
            <p className="text-white/30">No past orders yet</p>
          </div>
        )}
      </section>
    </div>
  );
};

export { OrdersView };
