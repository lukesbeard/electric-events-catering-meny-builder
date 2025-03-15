#!/usr/bin/env python3
"""
Tripleseat API Proxy Server

This script creates a simple HTTP server that proxies requests to the Tripleseat API.
It helps bypass CORS restrictions during local development.

Usage:
    python tripleseat_proxy.py

The server will start on port 3002 by default and will handle requests to:
    - /api/tripleseat/leads - Forwards to the real Tripleseat API
    - /api/tripleseat/mock - Returns a mock success response for testing
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import json
import ssl
import sys

class TripleSeatProxy(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def do_POST(self):
        """Handle POST requests - either proxy to Tripleseat or return mock data"""
        # Get the size of data
        content_length = int(self.headers['Content-Length'])
        # Get the data itself
        post_data = self.rfile.read(content_length)
        
        # Log the received data for debugging
        print("\n===== REQUEST DATA =====")
        print(post_data.decode('utf-8'))
        print("========================\n")
        
        # Mock API endpoint for testing
        if self.path == '/api/tripleseat/mock':
            print("Using MOCK endpoint - returning success response")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'lead_id': '12345',
                'message': 'Mock lead created successfully'
            }
            self.wfile.write(json.dumps(response).encode())
            return
        
        # Real Tripleseat API endpoint
        if self.path == '/api/tripleseat/leads':
            tripleseat_url = "https://api.tripleseat.com/v1/leads/create.js"
            print(f"Forwarding request to: {tripleseat_url}")
            
            # Forward to real Tripleseat API
            try:
                # Create request to Tripleseat
                req = urllib.request.Request(
                    tripleseat_url,
                    data=post_data,
                    headers={
                        'Content-Type': 'application/json',
                    }
                )
                
                # Send the request to Tripleseat
                context = ssl._create_unverified_context()
                response = urllib.request.urlopen(req, context=context)
                
                # Get the response
                response_data = response.read()
                
                print("\n===== TRIPLESEAT RESPONSE =====")
                print(response_data.decode('utf-8'))
                print("===============================\n")
                
                # Send response back to client
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(response_data)
                
            except Exception as e:
                # Handle errors
                print(f"ERROR: {str(e)}")
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                error_response = {
                    'success': False,
                    'error': str(e)
                }
                self.wfile.write(json.dumps(error_response).encode())
        else:
            # Unknown endpoint
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {
                'success': False,
                'error': f"Unknown endpoint: {self.path}"
            }
            self.wfile.write(json.dumps(error_response).encode())

def run(server_class=HTTPServer, handler_class=TripleSeatProxy, port=3002):
    """Run the HTTP server"""
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f'Starting Tripleseat proxy server on port {port}...')
    print('Press Ctrl+C to stop the server')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down server...')
        httpd.server_close()

if __name__ == '__main__':
    # Allow port to be specified as command line argument
    port = 3002
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"Invalid port number: {sys.argv[1]}")
            sys.exit(1)
    
    run(port=port) 