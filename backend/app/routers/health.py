from fastapi import APIRouter
import subprocess

router = APIRouter()

@router.get("/")
def read_root():
    return {"message": "YouTube Video Downloader API is running."}

@router.get("/health")
def health_check():
    def check_cmd(cmd):
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return True, result.stdout.strip()
        except Exception as e:
            return False, str(e)

    yt_dlp_ok, yt_dlp_msg = check_cmd(["yt-dlp", "--version"])
    ffmpeg_ok, ffmpeg_msg = check_cmd(["ffmpeg", "-version"])

    return {
        "status": "ok" if yt_dlp_ok and ffmpeg_ok else "error",
        "yt_dlp": {"ok": yt_dlp_ok, "msg": yt_dlp_msg},
        "ffmpeg": {"ok": ffmpeg_ok, "msg": ffmpeg_msg},
    }