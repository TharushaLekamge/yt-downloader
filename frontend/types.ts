export interface Format {
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