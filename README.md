# YouTube Video Downloader Backend

## Overview
This project is a Python backend for downloading videos from YouTube (and other platforms supported by yt-dlp) via a REST API. It is built with FastAPI and designed for easy deployment using Docker, including compatibility with TrueNAS.

### Core Technologies
- **Python 3.12.4**
- **FastAPI** for REST API
- **yt-dlp** and **ffmpeg** for video downloading and processing
- **Docker** for containerized deployment

## Features
- Exposes a REST API for video downloading (future endpoints)
- Uses `yt-dlp` and `ffmpeg` for robust video/audio handling
- Dockerized for development and production
- Live reload in development mode

## Getting Started

### Prerequisites
- Docker (recommended for all platforms, including TrueNAS)
- (Optional) Python 3.12.4+ and pip for local development

### Running with Docker

#### Development Mode (with live reload)

```
docker build -t yt-downloader .
docker run --rm -it -p 20000:20000 -e DEV_MODE=1 yt-downloader
```

#### Production Mode

```
docker build -t yt-downloader .
docker run --rm -it -p 20000:20000 yt-downloader
```

- The API will be available at: [http://localhost:20000](http://localhost:20000)
- The root endpoint `/` returns a status message.

### Environment Variables
- You can add a `.env` file in the project root for configuration (auto-loaded).
- Example:
  ```
  YT_DLP_OPTS=--format best
  DOWNLOAD_DIR=/downloads
  ```

## Project Structure
```
yt-downloader/
  app/
    main.py           # FastAPI app entrypoint
  Dockerfile          # Docker build file
  entrypoint.sh       # Entrypoint for dev/prod
  requirements.txt    # Python dependencies
  README.md           # Project documentation
  .env                # (Optional) Environment variables
```

## Next Steps
- Implement endpoints for video download, progress tracking, and configuration management.

---

*This project is in early development. Contributions and feedback are welcome!*