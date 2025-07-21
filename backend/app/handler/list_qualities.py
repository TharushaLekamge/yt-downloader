import subprocess
import re
from typing import List, Dict, Any

def list_qualities(youtube_url: str) -> List[Dict[str, Any]]:
    """
    Uses yt-dlp -F to list all available formats for a given YouTube URL.
    Parses the plain-text output to extract key quality info.
    """
    cmd = [
        "yt-dlp",
        "-F",
        youtube_url
    ]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)

        lines = result.stdout.splitlines()

        # Find the start of the formats table
        format_lines = []
        collecting = False
        for line in lines:
            if re.match(r'^ID\s+EXT\s+RESOLUTION', line):
                collecting = True
                continue
            if collecting:
                if line.strip():  # skip blanks, don't break
                    format_lines.append(line.strip())

            print(line)

        parsed_formats = []
        print(len(format_lines))
        for line in format_lines:
            # Split on whitespace but preserve multi-word codec names using regex
            parts = re.split(r'\s{2,}', line)

            if len(parts) >= 9:
                parsed_formats.append({
                    "id": parts[0],
                    "ext": parts[1],
                    "resolution": parts[2],
                    "fps": parts[3] if len(parts) > 3 else '',
                    "ch": parts[4] if len(parts) > 4 else '',
                    "filesize": parts[5] if len(parts) > 5 else '',
                    "tbr": parts[6] if len(parts) > 6 else '',
                    "proto": parts[7] if len(parts) > 7 else '',
                    "vcodec": parts[8] if len(parts) > 8 else '',
                    "vbr": parts[9] if len(parts) > 9 else '',
                    "acodec": parts[10] if len(parts) > 10 else ''
                })

        return parsed_formats

    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"yt-dlp error: {e.stderr}")
