const https = require('https');

// Test the signup API endpoint
function testSignupAPI() {
    console.log('Testing Signup API...');
    
    const data = JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        company: 'Test Company',
        message: 'This is a test message from the API test'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/signup',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log('Response:', responseData);
            console.log('API Test Completed!');
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error.message);
        console.log('Note: This test requires the server to be running locally on port 3000');
        console.log('Run: npm run dev to start the development server');
    });

    req.write(data);
    req.end();
}

// Test the free signup API endpoint
function testFreeSignupAPI() {
    console.log('\nTesting Free Signup API...');
    
    const data = JSON.stringify({
        name: 'Free Test User',
        email: 'free@example.com'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/signup-free',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });

        res.on('end', () => {
            console.log('Response:', responseData);
        });
    });

    req.on('error', (error) => {
        console.error('Error:', error.message);
    });

    req.write(data);
    req.end();
}

// Run tests
console.log('Starting API Tests...');
console.log('Make sure the development server is running first!');
console.log('Run: npm run dev\n');

setTimeout(() => {
    testSignupAPI();
    setTimeout(testFreeSignupAPI, 2000);
}, 1000);
