FROM python:3.12.4-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Default environment variables (can be overridden at runtime)
ENV FLASK_APP=app/main.py
ENV FLASK_ENV=development

# Install 'watchgod' for live reload in dev mode
RUN pip install --no-cache-dir watchgod

# Entrypoint script to handle dev/prod mode
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY ./app ./app

EXPOSE 20000

ENTRYPOINT ["/entrypoint.sh"] 