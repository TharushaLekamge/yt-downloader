"use client";

import AllDownloadsSection from '../../components/AllDownloadsSection';
import Link from 'next/link';

export default function AllDownloadsPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <nav style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 22 }}>YouTube Downloader</span>
        <Link href="/download" style={{ color: '#2563eb', fontWeight: 500 }}>Download</Link>
        <Link href="/alldownloads" style={{ color: '#2563eb', fontWeight: 500 }}>All Downloads</Link>
      </nav>
      <AllDownloadsSection />
      <footer style={{ marginTop: 48, textAlign: 'center', color: '#888' }}>
        &copy; {new Date().getFullYear()} YouTube Downloader
      </footer>
    </div>
  );
}