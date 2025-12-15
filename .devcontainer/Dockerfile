FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Ensure SQLite library is available (comes with python-slim)
# If you ever need extended SQLite features, you’d add packages here.
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt




