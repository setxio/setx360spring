import type { Metadata, Viewport } from 'next';
import '../index.css';

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
