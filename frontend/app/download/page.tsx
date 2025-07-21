"use client";

import { useState } from "react";

interface Format {
  ID: string;
  EXT: string;
  RESOLUTION: string | null;
  FPS: number | null;
  CH: number | null;
  FILESIZE: number | null;
  TBR: number | null;
  PROTO: string | null;
  VCODEC: string | null;
  VBR: number | null;
  ACODEC: string | null;
  ABR: number | null;
  ASR: number | null;
  MORE_INFO: string | null;
}

export default function DownloadPage() {
  const [url, setUrl] = useState("");
  const [formats, setFormats] = useState<Format[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"single" | "audio_video">("single");
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

  const handleDownload = async () => {
    setDownloadStatus(null);
    setError(null);
    let video_quality = "bestvideo";
    let audio_quality = "bestaudio";
    if (selectedMode === "single" && selectedFormat) {
      video_quality = selectedFormat;
      audio_quality = selectedFormat;
    } else if (selectedMode === "audio_video" && (selectedVideo || selectedAudio)) {
      video_quality = selectedVideo || "none";
      audio_quality = selectedAudio || "none";
    } else {
      setError("Please select a format to download.");
      return;
    }
    try {
      const res = await fetch("/api/download/download-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtube_url: url,
          video_quality,
          audio_quality,
        }),
      });
      if (!res.ok) throw new Error("Download failed");
      const data = await res.json();
      setDownloadStatus(`Download started. File path: ${data.file_path}`);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    }
  };

  const videoFormats = formats.filter(f => f.VCODEC && f.VCODEC !== "none");
  const audioFormats = formats.filter(f => f.ACODEC && f.ACODEC !== "none");
  const avFormats = formats.filter(f => (f.VCODEC && f.VCODEC !== "none") && (f.ACODEC && f.ACODEC !== "none"));

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h1>YouTube Downloader</h1>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          style={{ width: 400, padding: 8, fontSize: 16 }}
        />
        <button onClick={fetchQualities} style={{ marginLeft: 8, padding: 8, fontSize: 16 }} disabled={loading || !url}>
          {loading ? "Loading..." : "Submit"}
        </button>
      </div>
      {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
      {formats.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <label>
              <input
                type="radio"
                checked={selectedMode === "single"}
                onChange={() => setSelectedMode("single")}
              />
              Single Format (audio+video or audio only or video only)
            </label>
            <label style={{ marginLeft: 24 }}>
              <input
                type="radio"
                checked={selectedMode === "audio_video"}
                onChange={() => setSelectedMode("audio_video")}
              />
              Separate Video & Audio
            </label>
          </div>
          {selectedMode === "single" && (
            <div style={{ marginBottom: 16 }}>
              <label>Select a format:</label>
              <select
                value={selectedFormat}
                onChange={e => setSelectedFormat(e.target.value)}
                style={{ marginLeft: 8, padding: 4 }}
              >
                <option value="">-- Select --</option>
                {formats.map(f => (
                  <option key={f.ID} value={f.ID}>
                    {f.ID} | {f.EXT} | {f.RESOLUTION || "-"} | {f.FPS || "-"}fps | {f.CH || "-"}ch | {f.FILESIZE ? (f.FILESIZE / 1024 / 1024).toFixed(2) + " MB" : "-"} | {f.TBR || "-"}kbps | {f.PROTO || "-"} | {f.VCODEC || "-"} | {f.VBR || "-"} | {f.ACODEC || "-"} | {f.ABR || "-"} | {f.ASR || "-"} | {f.MORE_INFO || "-"}
                  </option>
                ))}
              </select>
            </div>
          )}
          {selectedMode === "audio_video" && (
            <div style={{ marginBottom: 16, display: "flex", gap: 32 }}>
              <div>
                <label>Video:</label>
                <select
                  value={selectedVideo}
                  onChange={e => setSelectedVideo(e.target.value)}
                  style={{ marginLeft: 8, padding: 4 }}
                >
                  <option value="">-- Select Video --</option>
                  {videoFormats.map(f => (
                    <option key={f.ID} value={f.ID}>
                      {f.ID} | {f.EXT} | {f.RESOLUTION || "-"} | {f.FPS || "-"}fps | {f.FILESIZE ? (f.FILESIZE / 1024 / 1024).toFixed(2) + " MB" : "-"} | {f.VCODEC || "-"} | {f.VBR || "-"} | {f.MORE_INFO || "-"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Audio:</label>
                <select
                  value={selectedAudio}
                  onChange={e => setSelectedAudio(e.target.value)}
                  style={{ marginLeft: 8, padding: 4 }}
                >
                  <option value="">-- Select Audio --</option>
                  {audioFormats.map(f => (
                    <option key={f.ID} value={f.ID}>
                      {f.ID} | {f.EXT} | {f.ACODEC || "-"} | {f.ABR || "-"}kbps | {f.FILESIZE ? (f.FILESIZE / 1024 / 1024).toFixed(2) + " MB" : "-"} | {f.MORE_INFO || "-"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          <button onClick={handleDownload} style={{ padding: 10, fontSize: 16 }}>
            Download
          </button>
        </>
      )}
      {downloadStatus && <div style={{ color: "green", marginTop: 16 }}>{downloadStatus}</div>}
    </div>
  );
} 