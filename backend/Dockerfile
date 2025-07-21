# Use official Python image
FROM python:3.11-slim

# Set workdir
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Expose backend port (now 20000)
EXPOSE 20000

# Start backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "20000", "--reload"]