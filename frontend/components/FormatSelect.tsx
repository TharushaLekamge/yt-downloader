import { Format } from "../types";

interface Props {
  formats: any[];
  selectedFormat: string;
  setSelectedFormat: (id: string) => void;
}

export default function FormatSelect({ formats, selectedFormat, setSelectedFormat }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor="format-select" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
        Format
      </label>
      <select
        id="format-select"
        value={selectedFormat}
        onChange={e => setSelectedFormat(e.target.value)}
        style={{ width: '100%', padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
      >
        <option value="">-- Select Format --</option>
        {formats.map((f: any) => (
          <option key={f.id || f.ID} value={f.id || f.ID}>
            {(f.id || f.ID) + ' | ' + (f.ext || f.EXT) + ' | ' + (f.resolution || f.RESOLUTION || '-') + ' | ' + (f.filesize || f.FILESIZE ? ((f.filesize || f.FILESIZE) / 1024 / 1024).toFixed(2) + ' MB' : '-')}
          </option>
        ))}
      </select>
    </div>
  );
}
