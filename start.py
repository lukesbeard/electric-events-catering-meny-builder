#!/usr/bin/env python3
"""
Electric Events Catering Menu Builder - Start Script

This script starts:
1. A simple HTTP server on port 8000 to serve the static HTML/CSS/JS files
2. The Tripleseat proxy server on port 3002 to handle API requests

Usage:
    python start.py

Press Ctrl+C to stop both servers.
"""

import subprocess
import threading
import time
import webbrowser
import os
import signal
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

# Function to run the HTTP server for static files
def run_http_server():
    server_address = ('', 8000)
    httpd = HTTPServer(server_address, SimpleHTTPRequestHandler)
    print(f"Starting HTTP server on http://localhost:8000")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
        print("HTTP server stopped")

# Function to run the Tripleseat proxy server
def run_tripleseat_proxy():
    # Use subprocess to run the tripleseat_proxy.py script
    try:
        subprocess.run([sys.executable, "tripleseat_proxy.py"], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error running Tripleseat proxy: {e}")
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    # Print a welcome message
    print("=" * 70)
    print("Electric Events ⚡ Catering Menu Builder")
    print("=" * 70)
    print("Starting servers...")
    
    # Start HTTP server in a separate thread
    http_thread = threading.Thread(target=run_http_server)
    http_thread.daemon = True
    http_thread.start()
    
    # Start Tripleseat proxy in a separate thread
    proxy_thread = threading.Thread(target=run_tripleseat_proxy)
    proxy_thread.daemon = True
    proxy_thread.start()
    
    # Wait a moment for servers to start
    time.sleep(1)
    
    # Open the browser to the app
    print("Opening browser to http://localhost:8000")
    webbrowser.open("http://localhost:8000")
    
    print("\nPress Ctrl+C to stop the servers")
    
    try:
        # Keep the main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    
    print("\nServers stopped. Thank you for using Electric Events Catering Menu Builder!") 