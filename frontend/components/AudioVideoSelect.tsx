import { Format } from "../types";

interface Props {
  videoFormats: Format[];
  audioFormats: Format[];
  selectedVideo: string;
  selectedAudio: string;
  setSelectedVideo: (id: string) => void;
  setSelectedAudio: (id: string) => void;
}

export default function AudioVideoSelect({
  videoFormats,
  audioFormats,
  selectedVideo,
  selectedAudio,
  setSelectedVideo,
  setSelectedAudio
}: any) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <label htmlFor="video-format-select" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
          Video
        </label>
        <select
          id="video-format-select"
          value={selectedVideo}
          onChange={e => setSelectedVideo(e.target.value)}
          style={{ width: '100%', padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="">-- Select Video --</option>
          {videoFormats.map((f: any, index: number) => {
            const id = f.id || f.ID || '';
            const ext = f.ext || f.EXT || '';
            const resolution = f.resolution || f.RESOLUTION || '';
            const filesize = f.filesize || f.FILESIZE || '';
            const key = `${id}-${ext}-${resolution}-${filesize}-${index}`;

            return (
              <option key={key} value={id}>
                {`${id} | ${ext} | ${resolution || '-'} | ${
                  filesize ? (filesize / 1024 / 1024).toFixed(2) + ' MB' : '-'
                }`}
              </option>
            );
          })}
        </select>
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <label htmlFor="audio-format-select" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
          Audio
        </label>
        <select
          id="audio-format-select"
          value={selectedAudio}
          onChange={e => setSelectedAudio(e.target.value)}
          style={{ width: '100%', padding: 8, fontSize: 16, borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="">-- Select Audio --</option>
          {audioFormats.map((f: any) => (
            <option
              key={`${f.id || f.ID}-${f.ext || f.EXT}-${f.acodec || f.ACODEC || ''}`}
              value={f.id || f.ID}
            >
              {(f.id || f.ID) + ' | ' + (f.ext || f.EXT) + ' | ' + (f.acodec || f.ACODEC || '-') + ' | ' + (f.filesize || f.FILESIZE ? ((f.filesize || f.FILESIZE) / 1024 / 1024).toFixed(2) + ' MB' : '-')}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
