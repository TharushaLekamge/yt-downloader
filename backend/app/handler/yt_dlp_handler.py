import subprocess
import tempfile
import os
import shutil

COOKIES_PATH = os.getenv("YT_DLP_COOKIES", os.path.join(os.path.dirname(__file__), "cookies.txt"))

def get_video_title_and_extension(youtube_url: str) -> str:
    """Fetch the output filename using yt-dlp without downloading."""
    cmd = [
        "yt-dlp",
        "--get-filename",
        "-o", "%(title)s.%(ext)s",
        youtube_url
    ]
    if os.path.exists(COOKIES_PATH):
        cmd.extend(["--cookies", COOKIES_PATH])
    
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    return result.stdout.strip().splitlines()[-1]

def build_download_command(youtube_url: str, output_path: str, video_quality: str, audio_quality: str) -> list:
    """Build the yt-dlp command to download the video with desired quality."""
    format_str = f"{video_quality}+{audio_quality}/{video_quality}/{audio_quality}/best"
    cmd = [
        "yt-dlp",
        "-f", format_str,
        "-o", output_path,
        "--verbose",
        youtube_url
    ]
    if os.path.exists(COOKIES_PATH):
        cmd.extend(["--cookies", COOKIES_PATH])
        print('Using cookies from', COOKIES_PATH)
    return cmd

def get_unique_filename(path: str) -> str:
    """Return a unique filename by appending (1), (2), etc., if the file already exists."""
    base, ext = os.path.splitext(path)
    counter = 1
    unique_path = path
    while os.path.exists(unique_path):
        unique_path = f"{base} ({counter}){ext}"
        counter += 1
    return unique_path

def move_downloaded_file(temp_dir: str, final_output_path: str) -> str:
    """Move the downloaded file from the temp directory to the final destination with renaming if needed."""
    files = os.listdir(temp_dir)
    if not files:
        raise RuntimeError("No file downloaded.")
    downloaded_file = os.path.join(temp_dir, files[0])
    final_output_path = get_unique_filename(final_output_path)
    os.makedirs(os.path.dirname(final_output_path), exist_ok=True)
    shutil.move(downloaded_file, final_output_path)
    return final_output_path

def download_video(
    youtube_url: str,
    output_path: str,
    video_quality: str = "bestvideo",
    audio_quality: str = "bestaudio"
) -> dict:
    """
    Downloads a YouTube video using yt-dlp with proper filename, cookies, and SRP structure.
    Renames file if a conflict exists.
    Returns a dictionary with status, file_path, stdout, and stderr.
    """
    try:
        real_filename = get_video_title_and_extension(youtube_url)
    except subprocess.CalledProcessError as e:
        return {
            "status": "error",
            "file_path": None,
            "stdout": e.stdout,
            "stderr": e.stderr
        }

    with tempfile.TemporaryDirectory() as tmpdir:
        temp_output_path = os.path.join(tmpdir, real_filename)
        target_dir = os.path.dirname(output_path)
        final_output_path = os.path.join(target_dir, real_filename)
        cmd = build_download_command(youtube_url, temp_output_path, video_quality, audio_quality)

        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
            moved_path = move_downloaded_file(tmpdir, final_output_path)
            return {
                "status": "success",
                "file_path": moved_path,
                "stdout": proc.stdout,
                "stderr": proc.stderr
            }
        except subprocess.CalledProcessError as e:
            return {
                "status": "error",
                "file_path": None,
                "stdout": e.stdout,
                "stderr": e.stderr
            }
        except Exception as e:
            return {
                "status": "error",
                "file_path": None,
                "stdout": "",
                "stderr": str(e)
            }
