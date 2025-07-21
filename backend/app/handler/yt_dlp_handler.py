import subprocess
import json
from typing import List, Dict, Any

from .list_qualities import list_qualities

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