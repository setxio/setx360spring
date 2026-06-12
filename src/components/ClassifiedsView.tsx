import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, Plus, Filter, Camera, MessageCircle, Clock, ShieldCheck, X, Heart, ChevronLeft, ChevronRight, Send, Image as ImageIcon, Map as MapIcon, Grid, Edit, Trash2, Calendar, CheckCircle, Store, Car, Home, ChevronDown, Eye, Flag, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Avatar } from './Avatar';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './ClassifiedsView.css';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import { CATEGORY_TAXONOMY } from '../lib/classifiedTaxonomy';

const createCustomIcon = (svgString: string, color: string) => new L.DivIcon({
  className: 'custom-leaflet-icon',
  html: `<div style="background-color: ${color}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">${svgString}</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const houseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

const eventIcon = createCustomIcon(starSvg, '#ef4444');
const propertyIcon = createCustomIcon(houseSvg, '#3b82f6');

interface ClassifiedItem {
  id: string;
  user_id: string;
  event_id?: string;
  title: string;
  price: number;
  location: string;
  latitude?: number;
  longitude?: number;
  category: string;
  description: string;
  images: string[];
  vehicle_details?: { make: string; model: string; year: string; mileage: string; transmission: string };
  real_estate_details?: { beds: string; baths: string; sqft: string; type: string };
  event_availability?: 'now' | 'event';
  status: string;
  renewal_count?: number;
  views?: number;
  item_details?: { subcategory?: string; type?: string; size?: string; color?: string; gender?: string; brand?: string; condition?: string };
  created_at: string;
  updated_at: string;
  profiles: { name: string; avatar_url: string };
}

interface ClassifiedEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  location_name: string;
  latitude: number;
  longitude: number;
  start_date: string;
  end_date: string;
  schedule?: Record<string, string>;
  status: string;
  created_at: string;
  profiles: { name: string; avatar_url: string };
}



type PostType = 'item' | 'vehicle' | 'real_estate' | 'event';
type MainTab = 'items' | 'vehicles' | 'real_estate' | 'map' | 'my_stuff' | 'saved';

export const ClassifiedsView: React.FC = () => {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState<MainTab>('items');
  
  // Data State
  const [items, setItems] = useState<ClassifiedItem[]>([]);
  const [events, setEvents] = useState<ClassifiedEvent[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubCategory, setActiveSubCategory] = useState('');
  const [activeItemType, setActiveItemType] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showFilterTray, setShowFilterTray] = useState(false);
  const [mapFilter, setMapFilter] = useState<'events' | 'properties'>('events');
  const [mapViewType, setMapViewType] = useState<'map' | 'list'>('map');

  // Modals
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    const handleTabChange = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('changeClassifiedsTab', handleTabChange);
    return () => window.removeEventListener('changeClassifiedsTab', handleTabChange);
  }, []);
  const [postType, setPostType] = useState<PostType>('item');
  const [selectedItem, setSelectedItem] = useState<ClassifiedItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<ClassifiedEvent | null>(null);
  const [eventItems, setEventItems] = useState<ClassifiedItem[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Form State - Universal
  const [postTitle, setPostTitle] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postLocation, setPostLocation] = useState(user?.location || '');
  const [postCategory, setPostCategory] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postImages, setPostImages] = useState<File[]>([]);
  
  // Form State - Map location
  const [postLat, setPostLat] = useState<number>(30.0802);
  const [postLng, setPostLng] = useState<number>(-94.1266);

  // Form State - Specific
  const [selectedEventId, setSelectedEventId] = useState<string>(''); 
  const [eventAvailability, setEventAvailability] = useState<'now'|'event'>('now');

  // Form State - General Item Details
  const [postSubCategory, setPostSubCategory] = useState('');
  const [postItemType, setPostItemType] = useState('');
  const [postFilterValues, setPostFilterValues] = useState<Record<string, string>>({});
  
  // Form State - Event
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventSchedule, setEventSchedule] = useState<Record<string, string>>({
    Monday: '', Tuesday: '', Wednesday: '', Thursday: '', Friday: '', Saturday: '', Sunday: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat State
  const [chatSeller, setChatSeller] = useState<{id: string, name: string} | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchData();
  }, [user, activeTab]);

  const fetchData = async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const [{ data: itemsData }, { data: eventsData }] = await Promise.all([
      supabase.from('classified_items').select('*, profiles(name, avatar_url)').order('created_at', { ascending: false }),
      supabase.from('classified_events').select('*, profiles(name, avatar_url)').order('start_date', { ascending: true })
    ]);

    if (itemsData) {
      const activeOrRecent = (itemsData as any[]).filter(item => {
        if (item.status === 'sold') return new Date(item.updated_at) > threeDaysAgo;
        return true;
      });
      setItems(activeOrRecent);
    }
    if (eventsData) {
      setEvents(eventsData as any);
    }

    if (user?.id) {
      const { data: favData } = await supabase.from('classified_favorites').select('item_id').eq('user_id', user.id);
      if (favData) setFavorites(new Set(favData.map(d => d.item_id)));
    }
  };

  const fetchEventItems = async (eventId: string) => {
    const { data } = await supabase.from('classified_items').select('*, profiles(name, avatar_url)').eq('event_id', eventId);
    if (data) setEventItems(data as any);
  };

  const toggleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation();
    if (!user?.id) return;
    const newFavs = new Set(favorites);
    if (newFavs.has(itemId)) {
      newFavs.delete(itemId);
      await supabase.from('classified_favorites').delete().eq('user_id', user.id).eq('item_id', itemId);
    } else {
      newFavs.add(itemId);
      await supabase.from('classified_favorites').insert({ user_id: user.id, item_id: itemId });
    }
    setFavorites(newFavs);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    
    const existingImages = postImages.filter(f => f.type.startsWith('image/'));
    const existingVideos = postImages.filter(f => f.type.startsWith('video/'));
    
    let allowedImages = 3;
    let allowedVideos = 1;
    if (postCategory === 'Property Rentals & Home Sales') {
      allowedImages = 20;
    } else if (postCategory === 'Vehicles & Powersports') {
      allowedImages = 10;
      allowedVideos = 2;
    }
    
    let imagesToAdd: File[] = [];
    let videosToAdd: File[] = [];
    
    for (const f of newFiles) {
      if (f.type.startsWith('image/') && existingImages.length + imagesToAdd.length < allowedImages) {
        imagesToAdd.push(f);
      } else if (f.type.startsWith('video/') && existingVideos.length + videosToAdd.length < allowedVideos) {
        videosToAdd.push(f);
      }
    }
    
    if (imagesToAdd.length + videosToAdd.length < newFiles.length) {
      showToast(`Limit reached: ${allowedImages} images and ${allowedVideos} video maximum.`);
    }
    
    setPostImages([...postImages, ...imagesToAdd, ...videosToAdd]);
  };

  const handleSubmit = async () => {
    if (!user?.id) return;
    setIsUploading(true);

    try {
      if (postType !== 'event') {
        const imageUrls: string[] = [];
        for (const file of postImages) {
          const fileExt = file.name.split('.').pop();
          const fileName = `classifieds/${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
          const { data, error } = await supabase.storage.from('posts').upload(fileName, file);
          if (!error && data) {
            const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(data.path);
            imageUrls.push(publicUrl);
          }
        }

        const numericPrice = parseFloat(postPrice.replace(/[^0-9.]/g, '')) || 0;

        const item_details = {
          subcategory: postSubCategory,
          type: postItemType,
          ...postFilterValues
        };

        await supabase.from('classified_items').insert({
          user_id: user.id,
          event_id: selectedEventId || null,
          title: postTitle,
          price: numericPrice,
          location: postLocation,
          latitude: postCategory === 'Property Rentals & Home Sales' ? postLat : null,
          longitude: postCategory === 'Property Rentals & Home Sales' ? postLng : null,
          category: postCategory,
          description: postDescription,
          images: imageUrls,
          item_details,
          event_availability: selectedEventId ? eventAvailability : 'now',
          status: 'active'
        });
      } else {
        await supabase.from('classified_events').insert({
          user_id: user.id,
          title: postTitle,
          description: postDescription,
          location_name: postLocation,
          latitude: postLat,
          longitude: postLng,
          start_date: eventStart,
          end_date: eventEnd,
          schedule: eventSchedule,
          status: 'active'
        });
      }

      setIsPosting(false);
      resetForms();
      fetchData();
      showToast('Successfully posted!');
    } catch (err) {
      console.error(err);
      showToast('Error creating post.');
    }
    setIsUploading(false);
  };

  const resetForms = () => {
    setPostTitle(''); setPostPrice(''); setPostDescription(''); setPostCategory(''); setPostImages([]); setSelectedEventId('');
    setPostLocation(user?.location || '');
    setEventAvailability('now');
    setEventStart(''); setEventEnd('');
    setEventSchedule({ Monday: '', Tuesday: '', Wednesday: '', Thursday: '', Friday: '', Saturday: '', Sunday: '' });
  };

  const handleUpdateItemStatus = async (id: string, status: string) => {
    await supabase.from('classified_items').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    fetchData();
  };

  const handleOpenPostForm = () => {
    if (activeTab === 'map' && mapFilter === 'events') {
      setPostType('event');
    } else {
      setPostType('item');
      if (activeTab === 'vehicles') setPostCategory('Vehicles & Powersports');
      else if (activeTab === 'real_estate' || (activeTab === 'map' && mapFilter === 'properties')) setPostCategory('Property Rentals & Home Sales');
      else setPostCategory('');
    }
    setIsPosting(true);
  };

  const handleRenewItem = async (id: string, currentCount: number) => {
    await supabase.from('classified_items').update({ 
      updated_at: new Date().toISOString(),
      renewal_count: (currentCount || 0) + 1
    }).eq('id', id);
    fetchData();
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Delete this listing?')) return;
    await supabase.from('classified_items').delete().eq('id', id);
    fetchData();
  };
  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Delete this event? All associated items will also be deleted.')) return;
    await supabase.from('classified_events').delete().eq('id', id);
    fetchData();
  };

  const handleSendInlineChat = () => {
    if (!chatMessage.trim()) return;
    showToast(`Message sent to ${chatSeller?.name}! They will reply in your Messages tab.`);
    setChatSeller(null);
    setChatMessage('');
  };

  const formatPrice = (price: number) => price === 0 ? 'Free' : `$${price.toLocaleString()}`;
  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${Math.max(1, hours)}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const MapUpdater = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => { map.flyTo([lat, lng], 13); }, [lat, lng, map]);
    return null;
  };

  const handleGeocodeAddress = async () => {
    if (!postLocation) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=` + encodeURIComponent(postLocation));
      const data = await res.json();
      if (data && data.length > 0) {
        setPostLat(parseFloat(data[0].lat));
        setPostLng(parseFloat(data[0].lon));
        showToast('Location pinned on map!');
      } else {
        showToast('Address not found. Please try again or pin manually.');
      }
    } catch(e) {
      console.error(e);
      showToast('Geocoding failed. Pin manually.');
    }
  };

  const LocationPicker = () => {
    useMapEvents({ click(e) { setPostLat(e.latlng.lat); setPostLng(e.latlng.lng); } });
    return <Marker position={[postLat, postLng]} />;
  };

  // Derived datasets
  const myItems = items.filter(i => i.user_id === user?.id && i.category !== 'Vehicles & Powersports' && i.category !== 'Property Rentals & Home Sales');
  const myVehicles = items.filter(i => i.user_id === user?.id && i.category === 'Vehicles & Powersports');
  const myProperties = items.filter(i => i.user_id === user?.id && i.category === 'Property Rentals & Home Sales');
  const myEvents = events.filter(e => e.user_id === user?.id);

  const savedProperties = items.filter(i => favorites.has(i.id) && i.category === 'Property Rentals & Home Sales');
  const savedVehicles = items.filter(i => favorites.has(i.id) && i.category === 'Vehicles & Powersports');
  const savedGeneralItems = items.filter(i => favorites.has(i.id) && i.category !== 'Vehicles & Powersports' && i.category !== 'Property Rentals & Home Sales');

  const getFilteredFeed = () => {
    let feed = items;
    if (activeTab === 'items') {
      feed = feed.filter(i => i.category !== 'Vehicles & Powersports' && i.category !== 'Property Rentals & Home Sales');
      if (activeCategory !== 'All') {
        feed = feed.filter(i => i.category === activeCategory);
        
        if (activeSubCategory) {
          feed = feed.filter(i => i.item_details?.subcategory === activeSubCategory);
        }
        if (activeItemType) {
          feed = feed.filter(i => i.item_details?.type === activeItemType);
        }

        // Apply dynamic smart filters
        Object.entries(filterValues).forEach(([key, value]) => {
          if (value && value.trim() !== '') {
            feed = feed.filter(i => {
              // @ts-ignore
              const itemVal = i.item_details?.[key];
              if (!itemVal) return false;
              return itemVal.toLowerCase().includes(value.toLowerCase());
            });
          }
        });
      }
    } else if (activeTab === 'vehicles') {
      feed = feed.filter(i => i.category === 'Vehicles & Powersports');
    } else if (activeTab === 'real_estate') {
      feed = feed.filter(i => i.category === 'Property Rentals & Home Sales');
    }
    
    return feed.filter(i => 
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
      i.status !== 'rented' // hide rented from global
    );
  };

  const renderItemCard = (item: ClassifiedItem) => (
    <div key={item.id} className="item-card glass" onClick={() => { setSelectedItem(item); setCurrentImageIndex(0); supabase.rpc('increment_classified_view', { p_item_id: item.id }).then(); }}>
      <div className="item-image-placeholder" style={{ position: 'relative', overflow: 'hidden', background: (!item.images?.[0] || item.images[0].match(/\.(mp4|webm|ogg|mov)$/i)) ? 'var(--glass-bg)' : `url(${item.images[0]}) center/cover` }}>
        {item.images?.[0]?.match(/\.(mp4|webm|ogg|mov)$/i) && (
          <video src={item.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} muted loop playsInline />
        )}
        {!(item.images && item.images.length > 0) && <ImageIcon size={32} style={{ opacity: 0.2 }} />}
        <button onClick={(e) => toggleFavorite(e, item.id)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: 8, display: 'flex', cursor: 'pointer' }}>
          <Heart size={16} fill={favorites.has(item.id) ? '#f43f5e' : 'none'} color={favorites.has(item.id) ? '#f43f5e' : '#fff'} />
        </button>
        <span className="item-price-tag">{formatPrice(item.price)}{item.category === 'Property Rentals & Home Sales' && '/mo'}</span>
        {item.status === 'sold' && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 'bold', fontSize: '1.5rem', letterSpacing: 2 }}>SOLD</div>}
      </div>
      <div className="item-body">
        <div className="item-top">
          <span className="item-cat">{item.category}</span>
          <span className="item-time"><Clock size={12} /> {formatTimeAgo(item.created_at)}</span>
        </div>
        <h3 className="item-title">{item.title}</h3>
        
        {item.vehicle_details && item.vehicle_details.year && (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
            {item.vehicle_details.year} {item.vehicle_details.make} {item.vehicle_details.model} • {item.vehicle_details.mileage} miles
          </div>
        )}
        {item.real_estate_details && item.real_estate_details.beds && (
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
            {item.real_estate_details.beds} Bed • {item.real_estate_details.baths} Bath • {item.real_estate_details.sqft} sqft
          </div>
        )}

        <div className="item-loc"><MapPin size={14} /> {item.location}</div>
        <div className="item-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="seller-info">
            <Avatar url={item.profiles?.avatar_url} name={item.profiles?.name} size={24} className="seller-avatar" />
            <div className="seller-meta">
              <span className="seller-name">{item.profiles?.name}</span>
            </div>
          </div>
          {user?.id !== item.user_id && (
            <button 
              onClick={(e) => { e.stopPropagation(); setChatSeller({ id: item.user_id, name: item.profiles?.name }); }} 
              style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', border: 'none', borderRadius: 20, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
            >
              <MessageCircle size={12} /> Message
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="classifieds-container">
      {toast && <div className="chat-toast glass" style={{ zIndex: 10000 }}>{toast}</div>}
      
      {/* Create Post Modal */}
      {isPosting && (
        <div className="post-modal-overlay" onClick={() => setIsPosting(false)}>
          <div className="post-modal glass" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{postType === 'event' ? 'Create Event' : 'Create Listing'}</h3>
              <button onClick={() => setIsPosting(false)}><X size={20} /></button>
            </div>


            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {postType !== 'event' && (
                <>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                    <div onClick={() => fileInputRef.current?.click()} style={{ width: 80, height: 80, flexShrink: 0, border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                      <Camera size={24} style={{ opacity: 0.7 }} />
                      <span style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>Add</span>
                    </div>
                    {postImages.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: 80, height: 80, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
                        {img.type.startsWith('video/') ? (
                          <video src={URL.createObjectURL(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                        ) : (
                          <img src={URL.createObjectURL(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        )}
                        <button onClick={() => setPostImages(postImages.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer' }}><X size={12} color="#fff" /></button>
                      </div>
                    ))}
                  </div>
                  <input type="file" hidden multiple accept="image/*,video/*" ref={fileInputRef} onChange={handleImageSelect} />
                </>
              )}

              <input type="text" placeholder="Title" value={postTitle} onChange={e => setPostTitle(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }} />
              
              {postType !== 'event' && (
                <>
                  <input type="number" placeholder="Price ($)" value={postPrice} onChange={e => setPostPrice(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder={postCategory === 'Property Rentals & Home Sales' ? "Full Address" : "Location/City"} value={postLocation} onChange={e => setPostLocation(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                    {postCategory === 'Property Rentals & Home Sales' && (
                      <button onClick={handleGeocodeAddress} style={{ padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><MapIcon size={16} /></button>
                    )}
                  </div>
                </>
              )}

              {postType === 'item' && (
                <>
                  {myEvents.length > 0 && (
                    <div style={{ display: 'flex', gap: '12px', background: 'rgba(139,92,246,0.1)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(139,92,246,0.2)' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.8rem', opacity: 0.7, color: '#c4b5fd' }}>Attach to Event (Optional)</label>
                        <select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#222', color: '#fff', marginTop: 4 }}>
                          <option value="">None</option>
                          {myEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                        </select>
                      </div>
                      {selectedEventId && (
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.8rem', opacity: 0.7, color: '#c4b5fd' }}>Availability</label>
                          <select value={eventAvailability} onChange={e => setEventAvailability(e.target.value as 'now'|'event')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#222', color: '#fff', marginTop: 4 }}>
                            <option value="now">Available Now</option>
                            <option value="event">Wait for Event</option>
                          </select>
                        </div>
                      )}
                    </div>
                  )}
                  <select value={postCategory} onChange={e => { setPostCategory(e.target.value); setPostSubCategory(''); setPostItemType(''); setPostFilterValues({}); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#222', color: '#fff' }}>
                    <option value="">Select Category</option>
                    {CATEGORY_TAXONOMY.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                  </select>
                  
                  {postCategory && (
                    <select value={postSubCategory} onChange={e => { setPostSubCategory(e.target.value); setPostItemType(''); setPostFilterValues({}); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#222', color: '#fff' }}>
                      <option value="">Select Sub-Category</option>
                      {CATEGORY_TAXONOMY.find(c => c.name === postCategory)?.subcategories.map(sub => <option key={sub.name} value={sub.name}>{sub.name}</option>)}
                    </select>
                  )}

                  {postSubCategory && (
                    <select value={postItemType} onChange={e => { setPostItemType(e.target.value); setPostFilterValues({}); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#222', color: '#fff' }}>
                      <option value="">Select Type</option>
                      {CATEGORY_TAXONOMY.find(c => c.name === postCategory)?.subcategories.find(s => s.name === postSubCategory)?.types.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  )}

                  {postItemType && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {CATEGORY_TAXONOMY.find(c => c.name === postCategory)?.subcategories.find(s => s.name === postSubCategory)?.types.find(t => t.name === postItemType)?.filters.map(filter => {
                        if (filter.type === 'select') {
                          return (
                            <div key={filter.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <label style={{ fontSize: '0.8rem', opacity: 0.7, color: '#c4b5fd' }}>{filter.label}</label>
                              <select 
                                value={postFilterValues[filter.id] || ''} 
                                onChange={e => setPostFilterValues(prev => ({ ...prev, [filter.id]: e.target.value }))} 
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                              >
                                <option value="">Select {filter.label}</option>
                                {filter.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>
                            </div>
                          );
                        } else {
                          return (
                            <div key={filter.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <label style={{ fontSize: '0.8rem', opacity: 0.7, color: '#c4b5fd' }}>{filter.label}</label>
                              <input 
                                type="text" 
                                placeholder={filter.label} 
                                value={postFilterValues[filter.id] || ''} 
                                onChange={e => setPostFilterValues(prev => ({ ...prev, [filter.id]: e.target.value }))} 
                                style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }} 
                              />
                            </div>
                          );
                        }
                      })}
                    </div>
                  )}
                </>
              )}

              {postType === 'event' && (
                <>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" placeholder="Street Address" value={postLocation} onChange={e => setPostLocation(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                    <button onClick={handleGeocodeAddress} style={{ padding: '0 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><MapIcon size={16} /></button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Start Date</label>
                      <input type="date" value={eventStart} onChange={e => setEventStart(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>End Date</label>
                      <input type="date" value={eventEnd} onChange={e => setEventEnd(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }} />
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '12px' }}>Daily Hours / Schedule</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <div key={day}>
                          <label style={{ fontSize: '0.75rem', opacity: 0.7 }}>{day}</label>
                          <input type="text" placeholder="e.g. 8am - 4pm" value={eventSchedule[day]} onChange={e => setEventSchedule({...eventSchedule, [day]: e.target.value})} style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.85rem' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <textarea placeholder="Description" rows={4} value={postDescription} onChange={e => setPostDescription(e.target.value)} style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', resize: 'vertical' }} />

              {(postType === 'event' || postCategory === 'Property Rentals & Home Sales') && (
                <>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Tap map to pin exact location</div>
                  <div style={{ height: 200, borderRadius: 8, overflow: 'hidden' }}>
                    <MapContainer center={[postLat, postLng]} zoom={11} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapUpdater lat={postLat} lng={postLng} />
                      <LocationPicker />
                    </MapContainer>
                  </div>
                </>
              )}

              <button onClick={handleSubmit} disabled={isUploading || !postTitle} className="submit-listing-btn" style={{ opacity: isUploading ? 0.5 : 1 }}>
                {isUploading ? 'Saving...' : 'Post Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item/Vehicle/Property Detail Modal */}
      {selectedItem && (
        <div className="post-modal-overlay" onClick={() => setSelectedItem(null)} style={{ zIndex: 5000 }}>
          <div className="post-modal glass" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            {selectedItem.images && selectedItem.images.length > 0 ? (
              <div style={{ position: 'relative', width: '100%', height: '300px', background: '#000' }}>
                {selectedItem.images[currentImageIndex].match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video src={selectedItem.images[currentImageIndex]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} controls autoPlay muted loop playsInline />
                ) : (
                  <img src={selectedItem.images[currentImageIndex]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="" />
                )}
                {selectedItem.images.length > 1 && (
                  <>
                    <button onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer' }}><ChevronLeft color="#fff" /></button>
                    <button onClick={() => setCurrentImageIndex(i => Math.min(selectedItem.images.length - 1, i + 1))} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer' }}><ChevronRight color="#fff" /></button>
                  </>
                )}
                <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer' }}><X size={20} color="#fff" /></button>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '200px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={48} color="rgba(255,255,255,0.2)" />
                <button onClick={() => setSelectedItem(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer' }}><X size={20} color="#fff" /></button>
              </div>
            )}
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem' }}>{selectedItem.title}</h2>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--brand-color)' }}>{formatPrice(selectedItem.price)}{selectedItem.category === 'Property Rentals & Home Sales' && '/mo'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={(e) => toggleFavorite(e, selectedItem.id)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', padding: 12, cursor: 'pointer' }} title="Favorite">
                    <Heart size={24} fill={favorites.has(selectedItem.id) ? '#f43f5e' : 'none'} color={favorites.has(selectedItem.id) ? '#f43f5e' : '#fff'} />
                  </button>
                  <button onClick={() => showToast('Listing reported to admins for review.')} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '50%', padding: 12, cursor: 'pointer' }} title="Report Suspicious Listing">
                    <Flag size={24} color="#ef4444" />
                  </button>
                </div>
              </div>

              {selectedItem.status === 'sold' && (
                <div style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '8px 12px', borderRadius: 8, marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <ShieldCheck size={16} /> Mark As Sold
                </div>
              )}
              {selectedItem.status === 'rented' && (
                <div style={{ background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '8px 12px', borderRadius: 8, marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}>
                  <CheckCircle size={16} /> Currently Rented
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: 24 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={16} /> {selectedItem.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={16} /> {formatTimeAgo(selectedItem.created_at)}</span>
              </div>

              {/* Specific Details Blocks */}
              {selectedItem.vehicle_details && selectedItem.vehicle_details.year && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><span style={{ opacity: 0.5, fontSize: '0.8rem', display: 'block' }}>Make</span><span style={{ fontWeight: 'bold' }}>{selectedItem.vehicle_details.make}</span></div>
                  <div><span style={{ opacity: 0.5, fontSize: '0.8rem', display: 'block' }}>Model</span><span style={{ fontWeight: 'bold' }}>{selectedItem.vehicle_details.model}</span></div>
                  <div><span style={{ opacity: 0.5, fontSize: '0.8rem', display: 'block' }}>Year</span><span style={{ fontWeight: 'bold' }}>{selectedItem.vehicle_details.year}</span></div>
                  <div><span style={{ opacity: 0.5, fontSize: '0.8rem', display: 'block' }}>Mileage</span><span style={{ fontWeight: 'bold' }}>{selectedItem.vehicle_details.mileage}</span></div>
                </div>
              )}

              {selectedItem.real_estate_details && selectedItem.real_estate_details.beds && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div><span style={{ opacity: 0.5, fontSize: '0.8rem', display: 'block' }}>Beds</span><span style={{ fontWeight: 'bold' }}>{selectedItem.real_estate_details.beds}</span></div>
                  <div><span style={{ opacity: 0.5, fontSize: '0.8rem', display: 'block' }}>Baths</span><span style={{ fontWeight: 'bold' }}>{selectedItem.real_estate_details.baths}</span></div>
                  <div><span style={{ opacity: 0.5, fontSize: '0.8rem', display: 'block' }}>SqFt</span><span style={{ fontWeight: 'bold' }}>{selectedItem.real_estate_details.sqft}</span></div>
                </div>
              )}

              {selectedItem.item_details && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: 16, borderRadius: 12, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                  {Object.entries(selectedItem.item_details).filter(([key]) => key !== 'subcategory' && key !== 'type').map(([key, value]) => (
                    <div key={key}>
                      <span style={{ opacity: 0.5, fontSize: '0.8rem', display: 'block', textTransform: 'capitalize' }}>{key}</span>
                      <span style={{ fontWeight: 'bold' }}>{value as string}</span>
                    </div>
                  ))}
                </div>
              )}

              <h4 style={{ margin: '0 0 8px', color: 'rgba(255,255,255,0.8)' }}>Description</h4>
              <p style={{ margin: '0 0 24px', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>{selectedItem.description}</p>

              {selectedItem.event_id && events.find(e => e.id === selectedItem.event_id) && (
                <div 
                  onClick={() => { setSelectedItem(null); setSelectedEvent(events.find(e => e.id === selectedItem.event_id) || null); fetchEventItems(selectedItem.event_id!); }}
                  style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', padding: 16, borderRadius: 12, marginBottom: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <Store size={24} color="#8b5cf6" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#8b5cf6' }}>Part of an Event!</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{events.find(e => e.id === selectedItem.event_id)?.title}</div>
                  </div>
                  {selectedItem.event_availability === 'event' && (
                    <div style={{ fontSize: '0.75rem', background: '#8b5cf6', color: '#fff', padding: '4px 8px', borderRadius: 4, fontWeight: 'bold' }}>Wait for Event</div>
                  )}
                  {selectedItem.event_availability !== 'event' && (
                    <div style={{ fontSize: '0.75rem', background: '#10b981', color: '#fff', padding: '4px 8px', borderRadius: 4, fontWeight: 'bold' }}>Available Now</div>
                  )}
                </div>
              )}

              <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar url={selectedItem.profiles.avatar_url} name={selectedItem.profiles.name} size={48} />
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedItem.profiles.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      <ShieldCheck size={14} color="#10b981" /> Verified Member
                    </div>
                  </div>
                </div>
                {user?.id !== selectedItem.user_id && (
                  <button onClick={() => { setSelectedItem(null); setChatSeller({ id: selectedItem.user_id, name: selectedItem.profiles.name }); }} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageCircle size={18} /> Message
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal (Restored) */}
      {selectedEvent && (
        <div className="post-modal-overlay" onClick={() => setSelectedEvent(null)} style={{ zIndex: 5000 }}>
          <div className="post-modal glass" onClick={e => e.stopPropagation()} style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ height: 200, position: 'relative' }}>
              <MapContainer center={[selectedEvent.latitude, selectedEvent.longitude]} zoom={14} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[selectedEvent.latitude, selectedEvent.longitude]} icon={eventIcon} />
              </MapContainer>
              <button onClick={() => setSelectedEvent(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', zIndex: 1000 }}><X size={20} color="#fff" /></button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <h2 style={{ margin: '0 0 8px', fontSize: '1.5rem' }}>{selectedEvent.title}</h2>
              <div style={{ display: 'flex', gap: '16px', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', marginBottom: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={16} /> {selectedEvent.location_name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={16} /> {new Date(selectedEvent.start_date).toLocaleDateString()} - {new Date(selectedEvent.end_date).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: '0 0 24px', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>{selectedEvent.description}</p>

              {selectedEvent.schedule && Object.entries(selectedEvent.schedule).some(([_, val]) => val.trim() !== '') && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 12px', color: 'rgba(255,255,255,0.9)' }}>Hours of Operation</h4>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const hours = selectedEvent.schedule?.[day];
                      if (!hours || hours.trim() === '') return null;
                      return (
                        <div key={day} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{day}</span>
                          <span style={{ fontWeight: 'bold' }}>{hours}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0 }}>Event Catalog</h3>
                  {user?.id === selectedEvent.user_id && (
                    <button 
                      onClick={() => { setSelectedEventId(selectedEvent.id); setPostType('item'); setIsPosting(true); }}
                      style={{ background: 'var(--brand-color)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: '0.85rem', cursor: 'pointer' }}
                    >
                      + Add Item
                    </button>
                  )}
                </div>
                
                {eventItems.length === 0 ? (
                  <div style={{ textAlign: 'center', opacity: 0.5, padding: '20px 0' }}>No items in catalog yet.</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px' }}>
                    {eventItems.map(item => (
                      <div key={item.id} onClick={() => { setSelectedEvent(null); setSelectedItem(item); }} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}>
                        <div style={{ height: 100, background: item.images?.[0] ? `url(${item.images[0]}) center/cover` : '#222' }} />
                        <div style={{ padding: 8 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                          <div style={{ color: 'var(--brand-color)', fontSize: '0.8rem' }}>{formatPrice(item.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline Chat Modal (Same as before) */}
      {chatSeller && (
        <div className="post-modal-overlay" onClick={() => setChatSeller(null)} style={{ zIndex: 6000 }}>
          <div className="post-modal glass" onClick={e => e.stopPropagation()} style={{ padding: 0, display: 'flex', flexDirection: 'column', height: '400px' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Chat with {chatSeller.name}</div>
              <button onClick={() => setChatSeller(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X color="#fff" size={20} /></button>
            </div>
            <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginBottom: 16 }}>Start of conversation</div>
            </div>
            <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 12 }}>
              <input type="text" placeholder="Type your message..." value={chatMessage} onChange={e => setChatMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendInlineChat()} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 20, padding: '12px 16px', color: '#fff', outline: 'none' }} />
              <button onClick={handleSendInlineChat} style={{ background: 'var(--brand-color)', border: 'none', borderRadius: '50%', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Send size={18} color="#fff" style={{ marginLeft: -2 }} />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="classifieds-header">
        <div className="title-row">
          <h1>Classifieds</h1>
          <button className="post-ad-btn" onClick={handleOpenPostForm}>
            <Plus size={18} /> Post
          </button>
        </div>

        {activeTab === 'items' && (
          <>
            <div className="search-bar-row" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="search-input-box" style={{ flex: 1 }}>
                <Search size={18} />
                <input type="text" placeholder="Search general items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              
              <select 
                value={activeCategory} 
                onChange={e => { setActiveCategory(e.target.value); setActiveSubCategory(''); setActiveItemType(''); setFilterValues({}); }} 
                style={{ padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#222', color: '#fff', outline: 'none' }}
              >
                <option value="All">All Categories</option>
                {CATEGORY_TAXONOMY.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
              </select>

              <button className="filter-pill" onClick={() => setShowFilterTray(!showFilterTray)}>
                <Filter size={16} /> Filters
              </button>
            </div>

            {showFilterTray && activeCategory !== 'All' && (
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <select 
                    value={activeSubCategory} 
                    onChange={e => { setActiveSubCategory(e.target.value); setActiveItemType(''); setFilterValues({}); }} 
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#222', color: '#fff' }}
                  >
                    <option value="">All Sub-Categories</option>
                    {CATEGORY_TAXONOMY.find(c => c.name === activeCategory)?.subcategories.map(sub => <option key={sub.name} value={sub.name}>{sub.name}</option>)}
                  </select>
                  
                  {activeSubCategory && (
                    <select 
                      value={activeItemType} 
                      onChange={e => { setActiveItemType(e.target.value); setFilterValues({}); }} 
                      style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: '#222', color: '#fff' }}
                    >
                      <option value="">All Types</option>
                      {CATEGORY_TAXONOMY.find(c => c.name === activeCategory)?.subcategories.find(s => s.name === activeSubCategory)?.types.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  )}
                </div>

                {activeItemType && CATEGORY_TAXONOMY.find(c => c.name === activeCategory)?.subcategories.find(s => s.name === activeSubCategory)?.types.find(t => t.name === activeItemType)?.filters.length! > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                    {CATEGORY_TAXONOMY.find(c => c.name === activeCategory)?.subcategories.find(s => s.name === activeSubCategory)?.types.find(t => t.name === activeItemType)?.filters.map(filter => (
                      <div key={filter.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: '0.8rem', opacity: 0.7, color: '#c4b5fd' }}>{filter.label}</label>
                        {filter.type === 'select' ? (
                          <select 
                            value={filterValues[filter.id] || ''} 
                            onChange={e => setFilterValues(prev => ({ ...prev, [filter.id]: e.target.value }))} 
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }}
                          >
                            <option value="">Any</option>
                            {filter.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <input 
                            type="text" 
                            placeholder={`Any ${filter.label}`}
                            value={filterValues[filter.id] || ''} 
                            onChange={e => setFilterValues(prev => ({ ...prev, [filter.id]: e.target.value }))} 
                            style={{ padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff' }} 
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button onClick={() => setFilterValues({})} style={{ background: 'none', border: 'none', color: '#c4b5fd', fontSize: '0.85rem', cursor: 'pointer' }}>Clear Filters</button>
                </div>
              </div>
            )}
          </>
        )}
        
        {activeTab === 'map' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: 16 }}>
            <button onClick={() => setMapFilter('events')} className={`cat-pill ${mapFilter === 'events' ? 'active' : ''}`}>Events</button>
            <button onClick={() => setMapFilter('properties')} className={`cat-pill ${mapFilter === 'properties' ? 'active' : ''}`}>Properties</button>
            
            <div style={{ marginLeft: 'auto', display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>
              <button onClick={() => setMapViewType('map')} style={{ padding: '6px 12px', borderRadius: 20, background: mapViewType === 'map' ? '#fff' : 'transparent', color: mapViewType === 'map' ? '#000' : '#fff', border: 'none' }}>Map</button>
              <button onClick={() => setMapViewType('list')} style={{ padding: '6px 12px', borderRadius: 20, background: mapViewType === 'list' ? '#fff' : 'transparent', color: mapViewType === 'list' ? '#000' : '#fff', border: 'none' }}>List</button>
            </div>
          </div>
        )}
      </header>

      <div className="items-grid" style={(activeTab === 'map' && mapViewType === 'map') ? { display: 'block', height: 'calc(100vh - 230px)', padding: 0 } : {}}>
        
        {(activeTab === 'items' || activeTab === 'vehicles' || activeTab === 'real_estate') && (
          getFilteredFeed().length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              <Grid size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <h3 style={{ margin: '0 0 8px' }}>No listings found here</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>Tap the title at the top to switch categories and explore Vehicles, Real Estate, or the Map!</p>
            </div>
          ) : (
            getFilteredFeed().map(renderItemCard)
          )
        )}

        {activeTab === 'map' && (
          mapViewType === 'map' ? (
            <div style={{ height: '100%', borderRadius: 12, overflow: 'hidden' }}>
              <MapContainer center={[30.0802, -94.1266]} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {mapFilter === 'events' ? events.map(ev => (
                  <Marker key={ev.id} position={[ev.latitude, ev.longitude]} icon={eventIcon}>
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 4px' }}>{ev.title}</h3>
                        <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 8 }}>{new Date(ev.start_date).toLocaleDateString()}</div>
                        <button onClick={() => { setSelectedEvent(ev); fetchEventItems(ev.id); }} style={{ background: 'var(--brand-color)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )) : items.filter(i => i.category === 'Property Rentals & Home Sales' && i.latitude && i.longitude).map(prop => (
                  <Marker key={prop.id} position={[prop.latitude!, prop.longitude!]} icon={propertyIcon}>
                    <Popup>
                      <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: '0 0 4px' }}>{prop.title}</h3>
                        <div style={{ fontSize: '1rem', color: '#10b981', fontWeight: 'bold', marginBottom: 8 }}>{formatPrice(prop.price)}/mo</div>
                        <button onClick={() => { setSelectedItem(prop); }} style={{ background: 'var(--brand-color)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 4, cursor: 'pointer' }}>
                          View Property
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          ) : (
            // Map List View
            mapFilter === 'events' ? events.map(ev => (
              <div key={ev.id} className="item-card glass" onClick={() => { setSelectedEvent(ev); fetchEventItems(ev.id); }}>
                <div style={{ padding: 16 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--brand-color)' }}>EVENT • {new Date(ev.start_date).toLocaleDateString()}</div>
                  <h3 style={{ margin: '4px 0 8px' }}>{ev.title}</h3>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {ev.location_name}</div>
                </div>
              </div>
            )) : items.filter(i => i.category === 'Property Rentals & Home Sales').map(renderItemCard)
          )
        )}

        {activeTab === 'my_stuff' && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* My Properties */}
                <div>
                  <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Home size={18} /> My Properties</h3>
                  {myProperties.length === 0 ? <div style={{ opacity: 0.5 }}>No properties listed.</div> : myProperties.map(item => (
                    <div key={item.id} className="glass" style={{ padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: item.images?.[0] ? `url(${item.images[0]}) center/cover` : '#222' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                          <div style={{ color: 'var(--brand-color)', fontSize: '0.9rem' }}>{formatPrice(item.price)}/mo</div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 4 }}>
                            Status: {item.status.toUpperCase()} • <Eye size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }}/> {item.views || 0} views
                          </div>
                        </div>
                        <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', padding: 8, borderRadius: 8, height: 'fit-content' }}><Trash2 size={16} /></button>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleUpdateItemStatus(item.id, 'active')} disabled={item.status === 'active'} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: item.status === 'active' ? '#10b981' : 'rgba(255,255,255,0.1)', color: '#fff' }}>Active</button>
                        <button onClick={() => handleUpdateItemStatus(item.id, 'rented')} disabled={item.status === 'rented'} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: item.status === 'rented' ? '#3b82f6' : 'rgba(255,255,255,0.1)', color: '#fff' }}>Rented</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* My Vehicles */}
                <div>
                  <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Car size={18} /> My Vehicles</h3>
                  {myVehicles.length === 0 ? <div style={{ opacity: 0.5 }}>No vehicles listed.</div> : myVehicles.map(item => (
                    <div key={item.id} className="glass" style={{ padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: item.images?.[0] ? `url(${item.images[0]}) center/cover` : '#222' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                          <div style={{ color: 'var(--brand-color)', fontSize: '0.9rem' }}>{formatPrice(item.price)}</div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 4 }}>
                            Status: {item.status.toUpperCase()} • <Eye size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }}/> {item.views || 0} views
                          </div>
                        </div>
                        <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', padding: 8, borderRadius: 8, height: 'fit-content' }}><Trash2 size={16} /></button>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleUpdateItemStatus(item.id, 'active')} disabled={item.status === 'active'} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: item.status === 'active' ? '#10b981' : 'rgba(255,255,255,0.1)', color: '#fff' }}>Active</button>
                        <button onClick={() => handleUpdateItemStatus(item.id, 'sold')} disabled={item.status === 'sold'} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: item.status === 'sold' ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff' }}>Sold</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* My Items */}
                <div>
                  <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Grid size={18} /> My General Items</h3>
                  {myItems.length === 0 ? <div style={{ opacity: 0.5 }}>No items listed.</div> : myItems.map(item => {
                    const daysOld = Math.floor((Date.now() - new Date(item.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                    const isExpiring = daysOld >= 27;
                    return (
                    <div key={item.id} className="glass" style={{ padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 60, height: 60, borderRadius: 8, background: item.images?.[0] ? `url(${item.images[0]}) center/cover` : '#222' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold' }}>{item.title}</div>
                          <div style={{ color: 'var(--brand-color)', fontSize: '0.9rem' }}>{formatPrice(item.price)}</div>
                          <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 4 }}>
                            Status: {item.status.toUpperCase()} • Expires in {Math.max(0, 30 - daysOld)} days • <Eye size={12} style={{ verticalAlign: 'middle', marginLeft: 4 }}/> {item.views || 0} views
                          </div>
                        </div>
                        <button onClick={() => handleDeleteItem(item.id)} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: 'none', padding: 8, borderRadius: 8, height: 'fit-content' }}><Trash2 size={16} /></button>
                      </div>
                      {isExpiring && (
                        <button onClick={() => handleRenewItem(item.id, item.renewal_count || 0)} style={{ padding: '8px', borderRadius: 8, border: 'none', background: 'var(--brand-color)', color: '#fff', fontWeight: 'bold' }}>
                          Renew (+30 Days)
                        </button>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleUpdateItemStatus(item.id, 'active')} disabled={item.status === 'active'} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: item.status === 'active' ? '#10b981' : 'rgba(255,255,255,0.1)', color: '#fff' }}>Active</button>
                        <button onClick={() => handleUpdateItemStatus(item.id, 'sold')} disabled={item.status === 'sold'} style={{ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: item.status === 'sold' ? '#ef4444' : 'rgba(255,255,255,0.1)', color: '#fff' }}>Sold</button>
                      </div>
                    </div>
                  )})}
                </div>

                {/* My Events */}
                <div>
                  <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Calendar size={18} /> My Events</h3>
                  {myEvents.length === 0 ? <div style={{ opacity: 0.5 }}>No events hosted.</div> : myEvents.map(ev => (
                    <div key={ev.id} className="glass" style={{ padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{ev.title}</div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>{new Date(ev.start_date).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => { setSelectedEvent(ev); fetchEventItems(ev.id); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px 12px', borderRadius: 8, color: '#fff' }}>View Catalog</button>
                        <button onClick={() => handleDeleteEvent(ev.id)} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', padding: '6px 12px', borderRadius: 8, color: '#ef4444' }}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {favorites.size === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>You haven't saved any items yet.</div>
            )}
            
            {savedProperties.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Home size={18} /> Saved Properties</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  {savedProperties.map(renderItemCard)}
                </div>
              </div>
            )}

            {savedVehicles.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Car size={18} /> Saved Vehicles</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  {savedVehicles.map(renderItemCard)}
                </div>
              </div>
            )}

            {savedGeneralItems.length > 0 && (
              <div>
                <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Grid size={18} /> Saved General Items</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                  {savedGeneralItems.map(renderItemCard)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="classifieds-fab" onClick={handleOpenPostForm}>
        <button className="fab-main">
          <Camera size={24} />
          <span>Post</span>
        </button>
      </div>
    </div>
  );
};




