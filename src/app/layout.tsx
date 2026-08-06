import './globals.css';
import { Metadata, Viewport } from 'next';
import { AppProvider } from '../lib/context';
import { ThemeProvider } from '../lib/themeContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#031c13',
};

export const metadata: Metadata = {
  title: {
    default: "Markazu Umar bn Al-Khattab Centre for Qur'an Memorization and Islamic Studies - Daneji",
    template: "%s | Markazu Umar bn Al-Khattab",
  },
  description: "Premier Islamic Institution and 30-Juz Qur'an Memorization Center in Daneji Quarters, Kano, Nigeria. Offering Tahfiz, Islamiyya, Arabic Studies, Fiqh, Hadith, and moral discipline.",
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
  metadataBase: new URL("https://markazuumar.edu.ng"),
  openGraph: {
    title: "Markazu Umar bn Al-Khattab Centre for Qur'an Memorization and Islamic Studies - Daneji",
    description: "Fostering spiritual growth, 30-Juz Qur'an memorization, and classical Islamic education across 2,000+ students in Daneji, Kano, Nigeria.",
    url: "https://markazuumar.edu.ng",
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
  "email": "markazuumarbnkhaddabdaneji@gmail.com",
  "url": "https://markazuumar.edu.ng"
};

const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('markazu_theme_mode');
      var prefDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var active = (saved === 'dark' || saved === 'light') ? saved : (saved === 'system' ? (prefDark ? 'dark' : 'light') : 'dark');
      document.documentElement.classList.add(active);
      document.documentElement.classList.remove(active === 'dark' ? 'light' : 'dark');
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&family=Manrope:wght@300;400;500;600;700;800&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-gray-100 min-h-screen transition-colors duration-200">
        <ThemeProvider>
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


