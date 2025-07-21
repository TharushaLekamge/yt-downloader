import subprocess
import json
from typing import List, Dict, Any

def list_qualities(youtube_url: str) -> List[Dict[str, Any]]:
    """
    Uses yt-dlp to list available formats for a given YouTube URL.
    Returns a list of available formats with quality info.
    """
    cmd = [
        "yt-dlp",
        "--dump-json",
        youtube_url
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        formats = []
        for line in result.stdout.splitlines():
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            if 'formats' in data:
                formats.extend(data['formats'])
        return formats
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"yt-dlp error: {e.stderr}")

def download_video(
    youtube_url: str,
    output_path: str,
    video_quality: str = "bestvideo",
    audio_quality: str = "bestaudio"
) -> str:
    """
    Uses yt-dlp to download the specified video and audio quality for a given YouTube URL.
    Returns the path to the downloaded file.
    """
    format_str = f"{video_quality}+{audio_quality}/{video_quality}/{audio_quality}/best"
    cmd = [
        "yt-dlp",
        "-f",
        format_str,
        "-o",
        output_path,
        youtube_url
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return output_path
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"yt-dlp error: {e.stderr}") 