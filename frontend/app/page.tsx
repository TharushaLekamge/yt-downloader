"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<string>("Loading...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => setStatus(data.status === "ok" ? "Backend is healthy" : "Backend status: " + data.status))
      .catch((err) => setError("Could not connect to backend."));
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <h1>YouTube Downloader Frontend</h1>
      <p>Backend status:</p>
      <pre style={{ background: "#f4f4f4", padding: 16, borderRadius: 8 }}>
        {error ? error : status}
      </pre>
      <a href="/download" style={{ marginTop: 24, display: "inline-block", fontSize: 18, color: '#0070f3', textDecoration: 'underline' }}>Go to Download Page</a>
    </div>
  );
}
