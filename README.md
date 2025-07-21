# YouTube Video Downloader

## Overview
This project is a full-stack YouTube video downloader with a FastAPI backend and a Next.js (React) frontend. The backend handles video downloading via yt-dlp, and the frontend provides a user interface.

### Core Technologies
- **Python 3.12.4** (Backend)
- **FastAPI** for REST API
- **yt-dlp** and **ffmpeg** for video downloading and processing
- **Next.js (React + TypeScript)** for the frontend
- **Docker** for containerized deployment

## Features
- REST API for video downloading (future endpoints)
- Modern React frontend (Next.js)
- Dockerized for development and production
- Live reload in development mode

## Local Development Setup

### Prerequisites
- [Node.js & npm](https://nodejs.org/) (for frontend)
- [Python 3.12.4+](https://www.python.org/) & pip (for backend, optional if using Docker)
- [Docker](https://www.docker.com/) (optional, for containerized setup)

### 1. Clone the repository
```sh
git clone https://github.com/yourusername/yt-downloader.git
cd yt-downloader
```

### 2. Backend Setup (FastAPI)
#### a) Using Docker (recommended)
```sh
docker build -t yt-downloader .
docker run --rm -it -p 20000:20000 yt-downloader
```
- The API will be available at: http://localhost:20000

#### b) Local Python (dev mode)
```sh
cd app
pip install -r ../requirements.txt
uvicorn main:app --reload --port 20000
```

### 3. Frontend Setup (Next.js)
```sh
cd frontend
npm install
npm run dev
```
- The frontend will be available at: http://localhost:3000
- API requests to `/api/*` are automatically proxied to the backend (port 20000).

### 4. Environment Variables
- You can add a `.env` file in the project root for backend config (auto-loaded).
- Example:
  ```
  YT_DLP_OPTS=--format best
  DOWNLOAD_DIR=/downloads
  ```
- For frontend, add `.env.local` in `frontend/` if needed.

## Project Structure
```
yt-downloader/
  app/                # FastAPI backend
    main.py
  frontend/           # Next.js frontend
    ...
  Dockerfile
  entrypoint.sh
  requirements.txt
  README.md
  .env                # (Optional) Backend environment variables
  .gitignore
```

## Next Steps
- Implement endpoints for video download, progress tracking, and configuration management.
- Build out the frontend UI for submitting download requests.

## API Endpoints

### Download Endpoints

- `POST /download/download-video`  
  Start an immediate download. Request body: `{ youtube_url, video_quality, audio_quality }`. Returns a task ID and status.

- `POST /download/schedule-download`  
  Schedule a download for a future UTC time. Request body: `{ youtube_url, video_quality, audio_quality, scheduled_time (ISO 8601 UTC) }`. Returns a task ID and status.

- `GET /download/scheduled-downloads`  
  List all scheduled (pending) downloads. Returns current server time and a list of scheduled jobs with time remaining (in minutes) and all job details.

- `DELETE /download/scheduled-downloads/{task_id}`  
  Remove a scheduled download from the queue by its task ID. Returns status and task ID.

- `GET /download/past-downloads`  
  List all completed and errored downloads (history).

- `GET /download/download-status/{task_id}`  
  Get the status and file path of a specific download by task ID.

- `POST /download/list-qualities`  
  Get available formats for a YouTube URL. Request body: `{ link }`. Returns a list of formats.

---

*This project is in early development. Contributions and feedback are welcome!*

## Using YouTube Cookies for yt-dlp

To download age-restricted or private videos, or to avoid rate-limiting, you may need to provide your YouTube cookies to yt-dlp. Follow these steps:

1. **Export Cookies from Chrome:**
   - Install the [EditThisCookie Chrome extension](https://www.editthiscookie.com/start/).
   - Go to youtube.com and log in with your account.
   - Click the EditThisCookie icon in your browser toolbar.
   - Click the "Export" button to download your cookies as a `cookies.txt` file.

2. **Place the cookies.txt file:**
   - Move the downloaded `cookies.txt` file to `backend/app/handler/cookies.txt` in this repository.
   - The file is already git-ignored and will not be committed to version control.

3. **Restart Docker Compose:**
   - Run `docker-compose up --build` to ensure the backend picks up your cookies.

Your yt-dlp downloads will now use your YouTube cookies for authentication.