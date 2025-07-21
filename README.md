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

---

*This project is in early development. Contributions and feedback are welcome!*