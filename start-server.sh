#!/bin/bash

# VideoCharts Web - Start Local Server
# This script starts a local HTTP server for development/testing

echo "Starting VideoCharts Web server..."
echo "Open your browser at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Check if Python 3 is available
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
else
    echo "Error: Python is not installed"
    echo "Please install Python or use another web server"
    exit 1
fi
