import { Format } from "../types";

interface Props {
  formats: any[];
  selectedFormat: string;
  setSelectedFormat: (id: string) => void;
}

export default function FormatSelect({ formats, selectedFormat, setSelectedFormat }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor="single-format-select" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
        Select a format
      </label>
      <select
        id="single-format-select"
        value={selectedFormat}
        onChange={e => setSelectedFormat(e.target.value)}
        style={{ width: '100%', padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
      >
        <option value="">-- Select --</option>
        {formats.map(f => (
          <option key={
            (f.format_id || f.ID || "") + "-" + (f.ext || f.EXT || "") + "-" + (f.resolution || f.RESOLUTION || "")
          } value={f.format_id || f.ID}>
            {(f.format_id || f.ID)} | {(f.ext || f.EXT)} | {(f.resolution || f.RESOLUTION) || "-"} | {f.filesize ? (f.filesize / 1024 / 1024).toFixed(2) + " MB" : (f.FILESIZE ? (f.FILESIZE / 1024 / 1024).toFixed(2) + " MB" : "-")}
          </option>
        ))}
      </select>
    </div>
  );
}
