"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 32 }}>
      <nav style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32, borderBottom: '1px solid #eee', paddingBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 22 }}>YouTube Downloader</span>
        <Link href="/download" style={{ color: '#2563eb', fontWeight: 500 }}>Download</Link>
        <Link href="/alldownloads" style={{ color: '#2563eb', fontWeight: 500 }}>All Downloads</Link>
      </nav>
      <div style={{ textAlign: 'center', marginTop: 80 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>Welcome to YouTube Downloader</h1>
        <p style={{ fontSize: 18, color: '#444', marginBottom: 32 }}>
          Download YouTube videos or playlists, schedule downloads, and view your download history.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24 }}>
          <Link href="/download" style={{ padding: '16px 36px', background: '#2563eb', color: '#fff', borderRadius: 8, fontSize: 20, fontWeight: 600, textDecoration: 'none' }}>Go to Downloader</Link>
          <Link href="/alldownloads" style={{ padding: '16px 36px', background: '#f59e42', color: '#fff', borderRadius: 8, fontSize: 20, fontWeight: 600, textDecoration: 'none' }}>View All Downloads</Link>
        </div>
      </div>
    </div>
  );
}
