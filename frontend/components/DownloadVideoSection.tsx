import { useState, useEffect } from 'react';

export default function DownloadVideoSection() {
  const [url, setUrl] = useState('');
  const [qualityMode, setQualityMode] = useState<'default' | 'custom'>('default');
  const [videoQuality, setVideoQuality] = useState('bestvideo');
  const [audioQuality, setAudioQuality] = useState('bestaudio');
  const [audioOnly, setAudioOnly] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formats, setFormats] = useState<any[]>([]);
  const [fetchingFormats, setFetchingFormats] = useState(false);

  // Fetch available formats when custom mode is selected and url is valid
  useEffect(() => {
    if (qualityMode === 'custom' && url) {
      setFetchingFormats(true);
      setFormats([]);
      fetch('/api/download/list-qualities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link: url }),
      })
        .then(res => res.json())
        .then(data => {
          setFormats(data.results || []);
        })
        .catch(() => setFormats([]))
        .finally(() => setFetchingFormats(false));
    }
  }, [qualityMode, url]);

  // Extract video/audio formats for dropdowns
  const videoFormats = formats.filter(f => (f.vcodec || f.VCODEC) && (f.vcodec || f.VCODEC) !== 'none');
  const audioFormats = formats.filter(f => (f.acodec || f.ACODEC) && (f.acodec || f.ACODEC) !== 'none');

  const handleDownload = async () => {
    setStatus(null);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/download/download-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: url,
          video_quality: audioOnly ? 'bestaudio' : videoQuality,
          audio_quality: audioOnly ? 'bestaudio' : audioQuality,
        }),
      });
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      setStatus(`Download started. Task ID: ${data.task_id || data.file_path}`);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    setStatus(null);
    setError(null);
    if (!scheduleDate || !scheduleTime) {
      setError('Please select date and time');
      return;
    }
    setLoading(true);
    try {
      const localDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      const scheduled_time = localDateTime.toISOString();
      const res = await fetch('/api/download/schedule-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtube_url: url,
          video_quality: audioOnly ? 'bestaudio' : videoQuality,
          audio_quality: audioOnly ? 'bestaudio' : audioQuality,
          scheduled_time,
        }),
      });
      if (!res.ok) throw new Error('Failed to schedule download');
      const data = await res.json();
      setStatus(`Download scheduled. Task ID: ${data.task_id}`);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', padding: 24 }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>Download Video</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter YouTube video URL"
          style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <label style={{ fontWeight: 500 }}>
            <input
              type="radio"
              checked={qualityMode === 'default'}
              onChange={() => setQualityMode('default')}
              style={{ marginRight: 6 }}
            />
            Best Video + Best Audio
          </label>
          <label style={{ fontWeight: 500, display: 'flex', alignItems: 'center' }}>
            <input
              type="radio"
              checked={qualityMode === 'custom'}
              onChange={() => setQualityMode('custom')}
              style={{ marginRight: 6, marginLeft: 24 }}
              disabled={!url}
            />
            Custom Quality
            {!url && (
              <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>(Paste a URL first)</span>
            )}
            {qualityMode === 'custom' && url && fetchingFormats && (
              <span style={{ color: '#2563eb', fontSize: 13, marginLeft: 8 }}>Loading formats...</span>
            )}
          </label>
        </div>
        {qualityMode === 'custom' && !audioOnly && (
          <div style={{ display: 'flex', gap: 12 }}>
            <select
              value={videoQuality}
              onChange={e => setVideoQuality(e.target.value)}
              style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc', flex: 1 }}
              disabled={fetchingFormats}
            >
              <option value="">{fetchingFormats ? 'Loading video formats...' : 'Select video quality'}</option>
              {videoFormats.map((f, i) => {
                let size = f.filesize || f.FILESIZE || f.filesize_approx || f.FILESIZE_APPROX;
                let sizeDisplay = '-';
                if (typeof size === 'number') {
                  sizeDisplay = (size / 1024 / 1024).toFixed(2) + ' MB';
                } else if (typeof size === 'string' && size.match(/\d/)) {
                  sizeDisplay = size;
                }
                const bitrate = f.tbr || f.TBR ? `${f.tbr || f.TBR} kbps` : '';
                return (
                  <option key={`${f.id || f.ID}-${f.ext || f.EXT}-${i}`} value={f.id || f.ID}>
                    {(f.id || f.ID) + ' | ' + (f.ext || f.EXT) + ' | ' + (f.resolution || f.RESOLUTION || '-') + ' | ' + sizeDisplay + (bitrate ? ' | ' + bitrate : '')}
                  </option>
                );
              })}
            </select>
            <select
              value={audioQuality}
              onChange={e => setAudioQuality(e.target.value)}
              style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc', flex: 1 }}
              disabled={fetchingFormats}
            >
              <option value="">{fetchingFormats ? 'Loading audio formats...' : 'Select audio quality'}</option>
              {audioFormats.map((f, i) => {
                let size = f.filesize || f.FILESIZE || f.filesize_approx || f.FILESIZE_APPROX;
                let sizeDisplay = '-';
                if (typeof size === 'number') {
                  sizeDisplay = (size / 1024 / 1024).toFixed(2) + ' MB';
                } else if (typeof size === 'string' && size.match(/\d/)) {
                  sizeDisplay = size;
                }
                const bitrate = f.abr || f.ABR ? `${f.abr || f.ABR} kbps` : '';
                return (
                  <option key={`${f.id || f.ID}-${f.ext || f.EXT}-${i}`} value={f.id || f.ID}>
                    {(f.id || f.ID) + ' | ' + (f.ext || f.EXT) + ' | ' + (f.acodec || f.ACODEC || '-') + ' | ' + sizeDisplay + (bitrate ? ' | ' + bitrate : '')}
                  </option>
                );
              })}
            </select>
          </div>
        )}
        <label style={{ fontWeight: 500, marginTop: 4, color: '#aaa', cursor: 'not-allowed' }}>
          <input
            type="checkbox"
            checked={audioOnly}
            onChange={() => {}}
            style={{ marginRight: 6 }}
            disabled
          />
          Download audio only (mp3) <span style={{ color: '#888', fontSize: 13, marginLeft: 4 }}>(coming soon)</span>
        </label>
        <label style={{ fontWeight: 500, marginTop: 4 }}>
          <input
            type="checkbox"
            checked={schedule}
            onChange={e => setSchedule(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Schedule download
        </label>
        {schedule && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input
              type="date"
              value={scheduleDate}
              onChange={e => setScheduleDate(e.target.value)}
              style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <input
              type="time"
              value={scheduleTime}
              onChange={e => setScheduleTime(e.target.value)}
              style={{ padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <button
            type="button"
            onClick={schedule ? handleSchedule : handleDownload}
            disabled={loading || !url || (qualityMode === 'custom' && !audioOnly && (!videoQuality || !audioQuality)) || (schedule && (!scheduleDate || !scheduleTime))}
            style={{ padding: '10px 28px', fontSize: 18, borderRadius: 4, background: '#2563eb', color: '#fff', border: 'none', cursor: loading || !url || (qualityMode === 'custom' && !audioOnly && (!videoQuality || !audioQuality)) || (schedule && (!scheduleDate || !scheduleTime)) ? 'not-allowed' : 'pointer' }}
          >
            {schedule ? 'Schedule Download' : 'Download Now'}
          </button>
        </div>
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
        {status && <div style={{ color: 'green', marginTop: 8 }}>{status}</div>}
      </div>
    </div>
  );
} 