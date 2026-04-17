# Use Python 3.9 slim image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY database/ ./database/
COPY .env* ./

# Create database directory
RUN mkdir -p database

# Expose port
EXPOSE 8000

# Start both the FastAPI server and RQ worker
CMD ["sh", "-c", "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 & python worker.py & wait"]</content>
<parameter name="filePath">/Users/j3et/Downloads/CODE/Email Automation/Dockerfile