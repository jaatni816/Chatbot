import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://hartronindia.com'),
  title: 'HASC Kaithal AI Assistant | Hartron Advanced Skill Centre',
  description:
    'Ask the HASC Kaithal virtual assistant about courses, fees, duration, admission, scholarship and official contact details.',
  keywords: [
    'HASC Kaithal',
    'Hartron Advanced Skill Centre',
    'Hartron courses',
    'skill training Kaithal',
  ],
  openGraph: {
    title: 'HASC Kaithal AI Assistant',
    description:
      'Get clear, official information about HASC Kaithal courses and admissions.',
    url: 'https://hartronindia.com',
    siteName: 'Hartron Advanced Skill Centre, Kaithal',
    type: 'website',
  },
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}