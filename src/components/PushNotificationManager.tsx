import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

export const PushNotificationManager: React.FC = () => {
  const { user } = useApp();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setIsLoading(false);
    }
  }, []);

  const checkSubscription = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
    setIsLoading(false);
  };

  const subscribeToPush = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted for notifications');
      }

      // Generate or fetch VAPID key (Public)
      // Note: In a real prod env, this would come from an environment variable or config
      const vapidPublicKey = 'BEn_v7-Xq9Y5_5J-8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8_8'; 
      // Replace with your actual VAPID public key when deploying
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      // Send subscription to database
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            push_subscription: JSON.stringify(subscription)
          })
          .eq('id', user.id);
      }

      setIsSubscribed(true);
      console.log('User is subscribed:', subscription);
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      alert('Could not enable notifications. Please check your browser settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Remove from database
        if (user) {
          await supabase
            .from('profiles')
            .update({ push_subscription: null })
            .eq('id', user.id);
        }
        
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!isSupported) return null;

  return (
    <div className="push-manager-container">
      {isLoading ? (
        <div className="notif-loading">
          <Loader2 className="animate-spin" size={16} />
          <span>Syncing notification status...</span>
        </div>
      ) : isSubscribed ? (
        <button onClick={unsubscribeFromPush} className="notif-settings-btn subscribed" title="Disable Notifications">
          <Bell size={20} fill="currentColor" />
          <div className="notif-text">
            <span className="notif-status">Notifications On</span>
            <span className="notif-subtext">You will receive alerts and mentions</span>
          </div>
        </button>
      ) : (
        <button onClick={subscribeToPush} className="notif-settings-btn unsubscribed" title="Enable Notifications">
          <BellOff size={20} />
          <div className="notif-text">
            <span className="notif-status">Enable Notifications</span>
            <span className="notif-subtext">Get real-time updates on your device</span>
          </div>
        </button>
      )}
    </div>
  );
};
