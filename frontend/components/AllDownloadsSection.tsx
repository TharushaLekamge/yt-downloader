import { useEffect, useState } from 'react';

const TABS = [
  { key: 'all', label: 'All Downloads' },
  { key: 'completed', label: 'Completed' },
  { key: 'scheduled', label: 'Scheduled' },
];

function shortenUrl(url: string, max = 40) {
  if (!url) return '';
  return url.length > max ? url.slice(0, max - 3) + '...' : url;
}

function formatTime(iso: string | null | undefined) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString();
}

export default function AllDownloadsSection() {
  const [tab, setTab] = useState<'all' | 'completed' | 'scheduled'>('all');
  const [all, setAll] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [scheduled, setScheduled] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/download/past-downloads').then(r => r.json()),
      fetch('/api/download/scheduled-downloads').then(r => r.json()),
    ])
      .then(([completedData, scheduledData]) => {
        setCompleted(completedData || []);
        setScheduled((scheduledData.scheduled || []).map((j: any) => ({ ...j, current_time: scheduledData.current_time })));
        // For 'all', merge both
        setAll([
          ...(completedData || []),
          ...((scheduledData.scheduled || []).map((j: any) => ({ ...j, current_time: scheduledData.current_time })))
        ]);
      })
      .catch(() => setError('Failed to fetch downloads'))
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleDelete = async (task_id: string) => {
    if (!window.confirm('Delete this download?')) return;
    setLoading(true);
    setError(null);
    try {
      await fetch(`/api/download/scheduled-downloads/${task_id}`, { method: 'DELETE' });
      setRefresh(r => r + 1);
    } catch {
      setError('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  let data = all;
  if (tab === 'completed') data = completed;
  if (tab === 'scheduled') data = scheduled;

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 24 }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>All Downloads</h2>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            style={{
              padding: '8px 24px',
              borderRadius: 6,
              border: 'none',
              background: tab === t.key ? '#2563eb' : '#eee',
              color: tab === t.key ? '#fff' : '#333',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {loading && <div style={{ color: '#2563eb', marginBottom: 16 }}>Loading...</div>}
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <div style={{ minHeight: 120 }}>
        {data.length === 0 && !loading && <div style={{ color: '#888' }}>No downloads found.</div>}
        {data.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
            <thead>
              <tr style={{ background: '#f4f4f4' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Title/URL</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Quality</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Scheduled</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Time Left</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((job, i) => (
                <tr key={job.task_id || i} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8, maxWidth: 320 }}>
                    {shortenUrl(job.youtube_url)}
                  </td>
                  <td style={{ padding: 8 }}>
                    {job.status}
                  </td>
                  <td style={{ padding: 8 }}>
                    {job.video_quality || '-'} / {job.audio_quality || '-'}
                  </td>
                  <td style={{ padding: 8 }}>
                    {job.scheduled_time ? formatTime(job.scheduled_time) : '-'}
                  </td>
                  <td style={{ padding: 8 }}>
                    {typeof job.time_remaining === 'number' && job.status === 'scheduled'
                      ? `${job.time_remaining.toFixed(1)} min` : '-'}
                  </td>
                  <td style={{ padding: 8 }}>
                    {job.status === 'scheduled' && (
                      <button
                        onClick={() => handleDelete(job.task_id)}
                        style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 