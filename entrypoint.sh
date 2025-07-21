#!/bin/sh

if [ "$DEV_MODE" = "1" ]; then
    echo "Running in development mode with live reload."
    exec uvicorn app.main:app --host 0.0.0.0 --port 20000 --reload
else
    echo "Running in production mode."
    exec uvicorn app.main:app --host 0.0.0.0 --port 20000
fi 