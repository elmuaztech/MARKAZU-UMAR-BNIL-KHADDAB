import './globals.css';
import { Metadata, Viewport } from 'next';
import { AppProvider } from '../lib/context';
import { ThemeProvider } from '../lib/themeContext';
import { PwaRegister } from '../components/pwa/PwaRegister';
import { AppSplashLoader } from '../components/pwa/AppSplashLoader';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#031c13',
};

export const metadata: Metadata = {
  title: {
    default: "Markazu Umar bn Al-Khattab Centre for Qur'an Memorization and Islamic Studies - Daneji",
    template: "%s | Markazu Umar bn Al-Khattab",
  },
  description: "Premier Islamic Institution and 30-Juz Qur'an Memorization Center in Daneji Quarters, Kano, Nigeria. Offering Tahfiz, Islamiyya, Arabic Studies, Fiqh, Hadith, and moral discipline.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Markazu Umar SMS',
  },
  keywords: [
    "Markazu Umar",
    "Markazu Umar bn Al-Khattab",
    "Tahfiz School Kano",
    "Quran Memorization Kano",
    "Islamic Studies Daneji",
    "Islamiyya School Kano",
    "Arabic Studies Kano",
    "30-Juz Tahfiz Nigeria",
  ],
  authors: [{ name: "Elmuaz Technologies LTD" }],
  creator: "Elmuaz Technologies LTD",
  metadataBase: new URL("https://mubkdaneji.com"),
  openGraph: {
    title: "Markazu Umar bn Al-Khattab Centre for Qur'an Memorization and Islamic Studies - Daneji",
    description: "Fostering spiritual growth, 30-Juz Qur'an memorization, and classical Islamic education across 2,000+ students in Daneji, Kano, Nigeria.",
    url: "https://mubkdaneji.com",
    siteName: "Markazu Umar bn Al-Khattab",
    locale: "en_NG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Markazu Umar bn Al-Khattab Centre for Qur'an Memorization and Islamic Studies - Daneji",
    description: "Premier Islamic Institution and 30-Juz Qur'an Memorization School in Kano, Nigeria.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/logo-rounded.png', sizes: 'any' },
      { url: '/logo-rounded.png', type: 'image/png' },
    ],
    shortcut: '/logo-rounded.png',
    apple: '/logo-rounded.png',
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  "name": "Markazu Umar bn Khattab Tahfizul Qur'an & Islamic Studies School",
  "alternateName": "مركز عمر بن الخطاب لتحفيظ القرآن بالدراسات الإسلامية دنيج",
  "slogan": "العلم و التربية - Knowledge and Discipline",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "No. 32 Daneji Quarters, Behind Sahad Store",
    "addressLocality": "Kano",
    "addressCountry": "NG"
  },
  "telephone": ["08167109421", "09042786093", "08037966581", "07085206969"],
  "email": "info@mubkdaneji.com",
  "url": "https://mubkdaneji.com"
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('markazu_theme_mode');
      var prefDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var active = (saved === 'dark' || saved === 'light') ? saved : (saved === 'system' ? (prefDark ? 'dark' : 'light') : 'light');
      document.documentElement.classList.add(active);
      document.documentElement.classList.remove(active === 'dark' ? 'light' : 'dark');
    } catch (e) {}
  })();
`;

const appDetectionScript = `
  (function() {
    try {
      var isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         window.matchMedia('(display-mode: fullscreen)').matches ||
                         window.matchMedia('(display-mode: minimal-ui)').matches ||
                         (window.navigator && window.navigator.standalone === true) ||
                         window.location.search.indexOf('source=pwa') !== -1 ||
                         window.location.search.indexOf('mode=app') !== -1 ||
                         window.location.search.indexOf('app=true') !== -1 ||
                         (document.referrer && document.referrer.indexOf('android-app://') !== -1) ||
                         sessionStorage.getItem('markazu_app_mode') === 'true';
      if (isStandalone) {
        document.documentElement.classList.add('app-mode');
        sessionStorage.setItem('markazu_app_mode', 'true');
      }
    } catch (e) {}
  })();
`;

import { ImpersonationBanner } from '../components/navigation/ImpersonationBanner';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/logo-rounded.png" type="image/png" />
        <link rel="shortcut icon" href="/logo-rounded.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-rounded.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Markazu Umar" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: appDetectionScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-gray-100 min-h-screen transition-colors duration-200">
        <AppSplashLoader />
        <PwaRegister />
        <ThemeProvider>
          <AppProvider>
            <ImpersonationBanner />
            {children}
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


