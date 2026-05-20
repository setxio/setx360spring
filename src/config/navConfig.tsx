import React from 'react';
import {
  Users, Rss, Store, ShoppingCart, Heart, UserCircle, LayoutGrid,
  Compass, TrendingUp, Zap, Sparkles, ShieldCheck, BarChart3, Settings,
  Home, Monitor, Package, DollarSign, Map, MapPin, Search as SearchIcon,
  Utensils, Car, Calendar, Wrench, Briefcase, Ticket, QrCode,
  Wallet as WalletIcon, ArrowRightLeft, CreditCard, HeartPulse,
  History as HistoryIcon, Building, CarFront, Landmark, Plane, FileText,
  MessageCircle, Play, Film, Music, Palette, Church, Trophy, Activity,
  CloudSun, Newspaper, AlertTriangle, Megaphone, Bot, User, Bell,
  MessageSquare, Bookmark, ShoppingBag, Award, Plus
} from 'lucide-react';

export interface NavItem {
  icon: React.ReactNode;
  label: string;
}

export const meNav: NavItem[] = [
  { icon: <LayoutGrid size={24} />, label: 'One' },
  { icon: <BarChart3 size={24} />, label: 'Stats' },
  { icon: <Package size={24} />, label: 'Orders' },
  { icon: <WalletIcon size={24} />, label: 'Wallet' },
  { icon: <Bookmark size={24} />, label: 'Saved' },
  { icon: <Bell size={24} />, label: 'Alerts' },
  { icon: <Settings size={24} />, label: 'System' },
];

export const discoverNav: NavItem[] = [
  { icon: <Compass size={24} />, label: 'Discover' },
  { icon: <TrendingUp size={24} />, label: 'Trending' },
  { icon: <Zap size={24} />, label: 'Hot Deals' },
  { icon: <Sparkles size={24} />, label: 'New' },
  { icon: <Map size={24} />, label: 'Radar' },
  { icon: <User size={24} />, label: 'My Vibes' },
  { icon: <Bot size={24} color="var(--primary)" />, label: 'Tevis' },
];

export const socialNav: NavItem[] = [
  { icon: <Rss size={24} />, label: 'Feed' },
  { icon: <ShoppingBag size={24} />, label: 'Classifieds' },
  { icon: <Users size={24} />, label: 'Directory' },
  { icon: <LayoutGrid size={24} />, label: 'Groups' },
  { icon: <MessageSquare size={24} />, label: 'Messages' },
  { icon: <Bookmark size={24} />, label: 'Saved' },
  { icon: <Bell size={24} />, label: 'Alerts' },
  { icon: <User size={24} />, label: 'Profile' },
];

export const marketNav: NavItem[] = [
  { icon: <Store size={24} />, label: 'Home' },
  { icon: <SearchIcon size={24} />, label: 'Search' },
  { icon: <LayoutGrid size={24} />, label: 'Stores' },
  { icon: <ShoppingCart size={24} />, label: 'Cart' },
  { icon: <Heart size={24} />, label: 'Wishlist' },
  { icon: <UserCircle size={24} />, label: 'Account' },
];

export const eatsNav: NavItem[] = [
  { icon: <Utensils size={24} />, label: 'Home' },
  { icon: <SearchIcon size={24} />, label: 'Explore' },
  { icon: <ShoppingBag size={24} />, label: 'Orders' },
  { icon: <HistoryIcon size={24} />, label: 'History' },
  { icon: <User size={24} />, label: 'Account' },
];

export const ridesNav: NavItem[] = [
  { icon: <Car size={24} />, label: 'Rides' },
  { icon: <MapPin size={24} />, label: 'Pickup' },
  { icon: <Calendar size={24} />, label: 'Reserve' },
  { icon: <HistoryIcon size={24} />, label: 'Activity' },
  { icon: <User size={24} />, label: 'Account' },
];

export const servicesNav: NavItem[] = [
  { icon: <Wrench size={24} />, label: 'Home' },
  { icon: <Briefcase size={24} />, label: 'Pros' },
  { icon: <Calendar size={24} />, label: 'Schedule' },
  { icon: <HistoryIcon size={24} />, label: 'Bookings' },
  { icon: <User size={24} />, label: 'Account' },
];

export const eventsNav: NavItem[] = [
  { icon: <Ticket size={24} />, label: 'Home' },
  { icon: <SearchIcon size={24} />, label: 'Explore' },
  { icon: <QrCode size={24} />, label: 'Passes' },
  { icon: <Calendar size={24} />, label: 'Calendar' },
  { icon: <User size={24} />, label: 'Account' },
];

export const walletNav: NavItem[] = [
  { icon: <WalletIcon size={24} />, label: 'Home' },
  { icon: <ArrowRightLeft size={24} />, label: 'Pay' },
  { icon: <Sparkles size={24} />, label: 'Rewards' },
  { icon: <CreditCard size={24} />, label: 'Cards' },
  { icon: <User size={24} />, label: 'Account' },
];

export const careNav: NavItem[] = [
  { icon: <HeartPulse size={24} />, label: 'Home' },
  { icon: <Bell size={24} />, label: 'Alerts' },
  { icon: <Map size={24} />, label: 'Hotspot' },
  { icon: <HistoryIcon size={24} />, label: 'Log' },
  { icon: <User size={24} />, label: 'Account' },
];

export const homesNav: NavItem[] = [
  { icon: <Building size={24} />, label: 'Home' },
  { icon: <SearchIcon size={24} />, label: 'Search' },
  { icon: <Heart size={24} />, label: 'Saved' },
  { icon: <DollarSign size={24} />, label: 'Finance' },
  { icon: <User size={24} />, label: 'Agent' },
];

export const autoNav: NavItem[] = [
  { icon: <CarFront size={24} />, label: 'Home' },
  { icon: <LayoutGrid size={24} />, label: 'Stock' },
  { icon: <Landmark size={24} />, label: 'Finance' },
  { icon: <Wrench size={24} />, label: 'Service' },
  { icon: <User size={24} />, label: 'Account' },
];

export const travelNav: NavItem[] = [
  { icon: <Plane size={24} />, label: 'Home' },
  { icon: <Compass size={24} />, label: 'Explore' },
  { icon: <ShoppingBag size={24} />, label: 'Bookings' },
  { icon: <Map size={24} />, label: 'Guide' },
  { icon: <User size={24} />, label: 'Account' },
];

export const jobsNav: NavItem[] = [
  { icon: <Briefcase size={24} />, label: 'Jobs' },
  { icon: <SearchIcon size={24} />, label: 'Search' },
  { icon: <FileText size={24} />, label: 'Applied' },
  { icon: <MessageCircle size={24} />, label: 'Messages' },
  { icon: <User size={24} />, label: 'Profile' },
];

export const mediaNav: NavItem[] = [
  { icon: <Film size={24} />, label: 'Shorts' },
  { icon: <Play size={24} />, label: 'Videos' },
  { icon: <Music size={24} />, label: 'Music' },
];

export const artNav: NavItem[] = [
  { icon: <LayoutGrid size={24} />, label: 'Gallery' },
  { icon: <SearchIcon size={24} />, label: 'Explore' },
  { icon: <Palette size={24} />, label: 'Artists' },
  { icon: <Calendar size={24} />, label: 'Exhibitions' },
  { icon: <User size={24} />, label: 'Account' },
];

export const faithNav: NavItem[] = [
  { icon: <Home size={24} />, label: 'Sanctuary' },
  { icon: <Users size={24} />, label: 'Fellowship' },
  { icon: <Sparkles size={24} />, label: 'Daily Word' },
  { icon: <Calendar size={24} />, label: 'Services' },
  { icon: <User size={24} />, label: 'Account' },
];

export const sportsNav: NavItem[] = [
  { icon: <Trophy size={24} />, label: 'Scores' },
  { icon: <Activity size={24} />, label: 'Leagues' },
  { icon: <Calendar size={24} />, label: 'Schedule' },
  { icon: <Users size={24} />, label: 'Teams' },
  { icon: <User size={24} />, label: 'Account' },
];

export const newsNav: NavItem[] = [
  { icon: <CloudSun size={24} />, label: 'Weather' },
  { icon: <Newspaper size={24} />, label: 'News' },
  { icon: <Zap size={24} />, label: 'Alerts' },
  { icon: <Map size={24} />, label: 'Radar' },
  { icon: <User size={24} />, label: 'Account' },
];

export const civicsNav: NavItem[] = [
  { icon: <Landmark size={24} />, label: 'Home' },
  { icon: <AlertTriangle size={24} />, label: 'Report 311' },
  { icon: <HistoryIcon size={24} />, label: 'My Reports' },
  { icon: <WalletIcon size={24} />, label: 'Utilities' },
  { icon: <User size={24} />, label: 'Account' },
];

export const vendorNav: NavItem[] = [
  { icon: <Package size={24} />, label: 'Products' },
  { icon: <ShoppingBag size={24} />, label: 'Orders' },
  { icon: <DollarSign size={24} />, label: 'Finance' },
  { icon: <Settings size={24} />, label: 'Settings' },
  { icon: <Monitor size={24} />, label: 'Overview' },
  { icon: <Megaphone size={24} />, label: 'Ads' },
  { icon: <Store size={24} />, label: 'Store Front' },
  { icon: <Users size={24} />, label: 'Team' },
];

export const civicNav: NavItem[] = [
  { icon: <Users size={24} />, label: 'Directory' },
  { icon: <AlertTriangle size={24} />, label: 'Alerts' },
  { icon: <Megaphone size={24} />, label: 'Sponsorships' },
  { icon: <Settings size={24} />, label: 'Settings' },
  { icon: <Monitor size={24} />, label: 'Overview' },
  { icon: <HistoryIcon size={24} />, label: 'Tickets' },
  { icon: <WalletIcon size={24} />, label: 'Utilities' },
  { icon: <Users size={24} />, label: 'Team' },
];

export const adminNav: NavItem[] = [
  { icon: <Users size={24} />, label: 'Verify' },
  { icon: <BarChart3 size={24} />, label: 'Stats' },
  { icon: <Settings size={24} />, label: 'Config' },
  { icon: <ShieldCheck size={24} />, label: 'Dash' },
];

// Switcher env buttons (top footer pill)
export interface SwitcherItem {
  id: string;
  icon: React.ReactNode;
  label: string;
}

export const switcherItems: SwitcherItem[] = [
  { id: 'me',       icon: <User size={18} />,       label: 'Me' },
  { id: 'discover', icon: <Compass size={18} />,    label: 'Discover' },
  { id: 'social',   icon: <Rss size={18} />,        label: 'Social' },
  { id: 'market',   icon: <Store size={18} />,      label: 'Market' },
  { id: 'events',   icon: <Calendar size={18} />,   label: 'Events' },
  { id: 'news',     icon: <Newspaper size={18} />,  label: 'News' },
  { id: 'faith',    icon: <Church size={18} />,     label: 'Faith' },
  { id: 'eats',     icon: <Zap size={18} />,        label: 'Eats' },
  { id: 'services', icon: <Plus size={18} />,       label: 'Services' },
  { id: 'jobs',     icon: <Award size={18} />,      label: 'Jobs' },
];
