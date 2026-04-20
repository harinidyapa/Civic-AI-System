FROM python:3.10-slim

WORKDIR /app

# Install system dependencies efficiently
RUN apt-get update && apt-get install -y --no-install-recommends \
    libopencv-dev \
    python3-opencv \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create a health check endpoint
ENV FLASK_APP=app.py
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Use gunicorn with appropriate worker settings for Render
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "1", "--timeout", "120", "--worker-class", "sync", "--keep-alive", "5", "app:app"]
