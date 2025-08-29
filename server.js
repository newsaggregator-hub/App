const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

const server = http.createServer((req, res) => {
    // Parse the URL
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Serve static files
    if (pathname === '/' || pathname === '/index.html') {
        serveFile(res, 'index.html', 'text/html');
    } else if (pathname === '/styles.css') {
        serveFile(res, 'styles.css', 'text/css');
    } else if (pathname === '/script.js') {
        serveFile(res, 'script.js', 'application/javascript');
    } else if (pathname === '/api/signup') {
        // Mock API response for testing
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                console.log('Signup request received:', body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Signup successful (local test)',
                    data: JSON.parse(body)
                }));
            });
        } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
    } else if (pathname === '/api/signup-free') {
        // Mock API response for testing
        if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                console.log('Free signup request received:', body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    message: 'Free signup successful (local test)',
                    data: JSON.parse(body)
                }));
            });
        } else {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not allowed' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

function serveFile(res, filename, contentType) {
    const filePath = path.join('public', filename);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
    });
}

server.listen(PORT, () => {
    console.log(`Local test server running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});
