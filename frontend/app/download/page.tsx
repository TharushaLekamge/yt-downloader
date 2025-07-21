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
      setFormats(data.formats);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // Combined AV formats: both vcodec and acodec are not 'none'
  const combinedFormats = formats.filter(f => f.VCODEC && f.VCODEC !== "none" && f.ACODEC && f.ACODEC !== "none");
  // Video only: vcodec present, acodec is 'none'
  const videoFormats = formats.filter(f => f.VCODEC && f.VCODEC !== "none" && (!f.ACODEC || f.ACODEC === "none"));
  // Audio only: acodec present, vcodec is 'none'
  const audioFormats = formats.filter(f => f.ACODEC && f.ACODEC !== "none" && (!f.VCODEC || f.VCODEC === "none"));

  // If there are combined formats, use single dropdown mode
  const useCombined = combinedFormats.length > 0;

  const handleDownload = async () => {
    setDownloadStatus(null);
    setError(null);
    let body: any = { youtube_url: url };
    if (useCombined) {
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
    useCombined
      ? !!selectedFormat
      : !!selectedVideo && !!selectedAudio;

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
        </form>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {formats.length > 0 && (
          <>
            <div style={{ borderTop: '1px solid #eee', margin: '16px 0' }} />
            {useCombined ? (
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
      </div>
    </div>
  );
} 