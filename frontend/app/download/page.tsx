 "use client";

import { useState } from "react";
import FormatSelect from "../../components/FormatSelect";
import AudioVideoSelect from "../../components/AudioVideoSelect";
import { Format } from "../../types";

export default function DownloadPage() {
  const [url, setUrl] = useState("");
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [mode, setMode] = useState<"combined" | "separate">("combined");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const fetchQualities = async () => {
    setLoading(true);
    setError(null);
    setFormats([]);
    setSelectedFormat("");
    setSelectedVideo("");
    setSelectedAudio("");
    setDownloadStatus(null);
    try {
      const res = await fetch("/api/download/list-qualities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: url }),
      });
      if (!res.ok) throw new Error("Failed to fetch qualities");
      const data = await res.json();
      console.log("Fetched formats (raw):", data.results);
      setFormats(data.results || []);
      // Set default mode based on available formats
      const combined = (data.results || []).filter((f: any) => (f as any).vcodec && (f as any).vcodec !== "none" && (f as any).acodec && (f as any).acodec !== "none");
      console.log("Combined formats (on fetch):", combined);
      setMode(combined.length > 0 ? "combined" : "separate");
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Combined AV formats: both vcodec and acodec are not 'none'
  const combinedFormats = formats.filter(f => (f as any).vcodec && (f as any).vcodec !== "none" && (f as any).acodec && (f as any).acodec !== "none");
  const videoFormats = formats.filter(f => (f as any).vcodec && (f as any).vcodec !== "none" && (!(f as any).acodec || (f as any).acodec === "none"));
  const audioFormats = formats.filter(f => (f as any).acodec && (f as any).acodec !== "none" && (!(f as any).vcodec || (f as any).vcodec === "none"));
  console.log("Combined formats:", combinedFormats);
  console.log("Video only formats:", videoFormats);
  console.log("Audio only formats:", audioFormats);

  // If there are combined formats and separate formats, allow user to choose
  const canChooseMode = combinedFormats.length > 0 && (videoFormats.length > 0 || audioFormats.length > 0);

  const handleDownload = async () => {
    setDownloadStatus(null);
    setError(null);
    let body: any = { youtube_url: url };
    if (mode === "combined") {
      body.video_quality = selectedFormat;
    } else {
      body.video_quality = selectedVideo;
      body.audio_quality = selectedAudio;
    }
    try {
      const res = await fetch("/api/download/download-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Download failed");
      const data = await res.json();
      setDownloadStatus(`Download started. File path: ${data.file_path}`);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    }
  };

  // Download button enabled logic
  const canDownload =
    mode === "combined"
      ? !!selectedFormat
      : !!selectedVideo && !!selectedAudio;

  const handleDirectDownload = async () => {
    setDownloadStatus(null);
    setError(null);
    try {
      const res = await fetch("/api/download/download-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtube_url: url, video_quality: "bestvideo", audio_quality: "bestaudio" }),
      });
      if (!res.ok) throw new Error("Direct download failed");
      const data = await res.json();
      setDownloadStatus(`Direct download started. Task ID: ${data.task_id || data.file_path}`);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    }
  };

  const handleScheduleDownload = async () => {
    setScheduleStatus(null);
    setScheduleError(null);
    if (!url || !scheduleDate || !scheduleTime) {
      setScheduleError("Please enter a URL, date, and time.");
      return;
    }
    // Combine date and time in local timezone, then convert to UTC ISO string
    const localDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const scheduled_time = localDateTime.toISOString(); // This is always UTC
    // Use selected formats if present, else bestvideo/bestaudio
    let video_quality = selectedVideo || selectedFormat || "bestvideo";
    let audio_quality = selectedAudio || selectedFormat || "bestaudio";
    try {
      const res = await fetch("/api/download/schedule-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtube_url: url,
          video_quality,
          audio_quality,
          scheduled_time,
        }),
      });
      if (!res.ok) throw new Error("Failed to schedule download");
      const data = await res.json();
      setScheduleStatus(`Download scheduled. Task ID: ${data.task_id}`);
    } catch (e: any) {
      setScheduleError(e.message || "Unknown error");
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', marginTop: 48, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', padding: 24 }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>YouTube Downloader</h2>
        <form style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }} onSubmit={e => { e.preventDefault(); fetchQualities(); }}>
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            style={{ flex: 1, minWidth: 220, padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
            disabled={loading}
          />
          <button
            type="button"
            onClick={fetchQualities}
            disabled={loading || !url}
            style={{ padding: '8px 20px', fontSize: 16, borderRadius: 4, background: '#2563eb', color: '#fff', border: 'none', cursor: loading || !url ? 'not-allowed' : 'pointer' }}
          >
            {loading ? "Loading..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={handleDirectDownload}
            disabled={loading || !url}
            style={{ padding: '8px 20px', fontSize: 16, borderRadius: 4, background: '#f59e42', color: '#fff', border: 'none', cursor: loading || !url ? 'not-allowed' : 'pointer' }}
          >
            Direct Download (Best Quality)
          </button>
        </form>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {formats.length > 0 && (
          <>
            <div style={{ borderTop: '1px solid #eee', margin: '16px 0' }} />
            <div style={{ marginBottom: 12, fontSize: 15, color: '#444' }}>
              <span style={{ marginRight: 18 }}>
                <b>{combinedFormats.length}</b> audio+video
              </span>
              <span style={{ marginRight: 18 }}>
                <b>{videoFormats.length}</b> video only
              </span>
              <span>
                <b>{audioFormats.length}</b> audio only
              </span>
            </div>
            {canChooseMode && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500, marginRight: 24 }}>
                  <input
                    type="radio"
                    checked={mode === "combined"}
                    onChange={() => setMode("combined")}
                    style={{ marginRight: 6 }}
                  />
                  Combined (audio+video)
                </label>
                <label style={{ fontWeight: 500 }}>
                  <input
                    type="radio"
                    checked={mode === "separate"}
                    onChange={() => setMode("separate")}
                    style={{ marginRight: 6, marginLeft: 24 }}
                  />
                  Separate (audio and video)
                </label>
              </div>
            )}
            {mode === "combined" ? (
              <FormatSelect
                formats={combinedFormats}
                selectedFormat={selectedFormat}
                setSelectedFormat={setSelectedFormat}
              />
            ) : (
              <AudioVideoSelect
                videoFormats={videoFormats}
                audioFormats={audioFormats}
                selectedVideo={selectedVideo}
                selectedAudio={selectedAudio}
                setSelectedVideo={setSelectedVideo}
                setSelectedAudio={setSelectedAudio}
              />
            )}
            <button
              onClick={handleDownload}
              disabled={!canDownload}
              style={{ padding: '10px 28px', fontSize: 18, borderRadius: 4, background: canDownload ? '#22c55e' : '#ccc', color: '#fff', border: 'none', cursor: canDownload ? 'pointer' : 'not-allowed', marginTop: 8 }}
            >
              Download
            </button>
          </>
        )}
        {downloadStatus && <div style={{ color: 'green', marginTop: 16 }}>{downloadStatus}</div>}
        {/* Schedule Download Section */}
        <div style={{ marginTop: 32, padding: 16, border: '1px solid #eee', borderRadius: 8, background: '#f9fafb' }}>
          <h3 style={{ fontSize: 20, marginBottom: 12 }}>Schedule Download</h3>
          <div style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>
            Times are in your local timezone. The server will schedule in UTC.
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
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
            <button
              type="button"
              onClick={handleScheduleDownload}
              disabled={!url || !scheduleDate || !scheduleTime}
              style={{ padding: '8px 20px', fontSize: 16, borderRadius: 4, background: '#6366f1', color: '#fff', border: 'none', cursor: !url || !scheduleDate || !scheduleTime ? 'not-allowed' : 'pointer' }}
            >
              Schedule Download
            </button>
          </div>
          {scheduleError && <div style={{ color: 'red', marginBottom: 8 }}>{scheduleError}</div>}
          {scheduleStatus && <div style={{ color: 'green', marginBottom: 8 }}>{scheduleStatus}</div>}
        </div>
      </div>
    </div>
  );
}