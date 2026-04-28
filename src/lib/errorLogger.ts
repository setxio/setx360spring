import { supabase } from './supabase';

export const logError = async (error: any, context: string = 'client_error') => {
  try {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;
    
    const errorDetails = {
      message: error.message || String(error),
      stack: error.stack,
      context,
      user_id: userId,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      metadata: {
        theme: document.documentElement.getAttribute('data-theme'),
        env: document.documentElement.getAttribute('data-env')
      }
    };

    console.error(`[GlobalErrorLogger] ${context}:`, error);

    // We don't await this to avoid blocking the UI
    supabase.from('error_logs').insert(errorDetails).then(({ error: dbError }) => {
      if (dbError) console.warn('Failed to persist error log:', dbError);
    });
  } catch (e) {
    console.error('Error in error logger:', e);
  }
};
