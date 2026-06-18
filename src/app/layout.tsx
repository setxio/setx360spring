import type { Metadata, Viewport } from 'next';
import '../index.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'SETX 360 | The Regional Super-App',
  description: 'Your regional social platform powered by community',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SETX 360',
    startupImage: '/logo-setx-blue.png',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/logo-setx-blue.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="lazyOnload"
        />
        <Script id="google-translate-init" strategy="lazyOnload">
          {`
            window.googleTranslateElementInit = function() {
              new window.google.translate.TranslateElement({
                pageLanguage: 'en',
                autoDisplay: false
              }, 'google_translate_element');
            }
          `}
        </Script>
      </head>
      <body>
        <div id="google_translate_element" style={{ display: 'none' }}></div>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
