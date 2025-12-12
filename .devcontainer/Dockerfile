FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy application code into the container
COPY hello.py /app/hello.py

# Ensure SQLite library is available (comes with python-slim)
# If you ever need extended SQLite features, you’d add packages here.

# Default command: run the script
CMD ["python", "hello.py"]
