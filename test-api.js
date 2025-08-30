const axios = require('axios');

const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://your-vercel-domain.vercel.app' 
    : 'http://localhost:3000';

async function testWaitlistSignup() {
    console.log('Testing waitlist signup API...\n');
    
    try {
        // Test valid signup
        console.log('1. Testing valid signup:');
        const validPayload = {
            email: `test${Date.now()}@example.com`,
            topics: ['technology', 'business']
        };

        const response1 = await axios.post(`${BASE_URL}/api/signup`, validPayload);
        console.log('✅ Success:', response1.data);
        console.log('Status:', response1.status);
        console.log('---\n');

        // Test duplicate email (should update topics for unverified users)
        console.log('2. Testing duplicate email (update for unverified):');
        try {
            const response2 = await axios.post(`${BASE_URL}/api/signup`, validPayload);
            console.log('✅ Success (topics updated for unverified user):', response2.data);
            console.log('Status:', response2.status);
        } catch (error) {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
            console.log('Status:', error.response?.status);
        }
        console.log('---\n');

        // Test invalid email
        console.log('3. Testing invalid email:');
        try {
            const invalidEmailPayload = {
                email: 'invalid-email',
                topics: ['technology']
            };
            const response3 = await axios.post(`${BASE_URL}/api/signup`, invalidEmailPayload);
            console.log('❌ Should have failed with validation error');
        } catch (error) {
            console.log('✅ Expected error:', error.response?.data || error.message);
            console.log('Status:', error.response?.status);
        }
        console.log('---\n');

        // Test invalid topics
        console.log('4. Testing invalid topics:');
        try {
            const invalidTopicsPayload = {
                email: `test${Date.now() + 1}@example.com`,
                topics: ['invalid-topic']
            };
            const response4 = await axios.post(`${BASE_URL}/api/signup`, invalidTopicsPayload);
            console.log('❌ Should have failed with validation error');
        } catch (error) {
            console.log('✅ Expected error:', error.response?.data || error.message);
            console.log('Status:', error.response?.status);
        }
        console.log('---\n');

        // Test too many topics
        console.log('5. Testing too many topics:');
        try {
            const manyTopicsPayload = {
                email: `test${Date.now() + 2}@example.com`,
                topics: ['tech', 'business', 'politics', 'health', 'science', 'entertainment']
            };
            const response5 = await axios.post(`${BASE_URL}/api/signup`, manyTopicsPayload);
            console.log('❌ Should have failed with validation error');
        } catch (error) {
            console.log('✅ Expected error:', error.response?.data || error.message);
            console.log('Status:', error.response?.status);
        }
        console.log('---\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

async function testFreeSignup() {
    console.log('Testing free signup API...\n');
    
    try {
        // Test valid free signup
        console.log('1. Testing valid free signup:');
        const validPayload = {
            email: `free${Date.now()}@example.com`
        };

        const response1 = await axios.post(`${BASE_URL}/api/signup-free`, validPayload);
        console.log('✅ Success:', response1.data);
        console.log('Status:', response1.status);
        console.log('---\n');

        // Test duplicate email (should update for unverified users)
        console.log('2. Testing duplicate email (update for unverified):');
        try {
            const response2 = await axios.post(`${BASE_URL}/api/signup-free`, validPayload);
            console.log('✅ Success (updated for unverified user):', response2.data);
            console.log('Status:', response2.status);
        } catch (error) {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
            console.log('Status:', error.response?.status);
        }
        console.log('---\n');

        // Test invalid email
        console.log('3. Testing invalid email:');
        try {
            const invalidEmailPayload = {
                email: 'invalid-email'
            };
            const response3 = await axios.post(`${BASE_URL}/api/signup-free`, invalidEmailPayload);
            console.log('❌ Should have failed with validation error');
        } catch (error) {
            console.log('✅ Expected error:', error.response?.data || error.message);
            console.log('Status:', error.response?.status);
        }
        console.log('---\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
        }
    }
}

async function testHealthCheck() {
    console.log('Testing health check endpoint...\n');
    
    try {
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health check successful:');
        console.log('Status:', response.status);
        console.log('Data:', response.data);
        console.log('---\n');
    } catch (error) {
        console.error('❌ Health check failed:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting API tests...\n');
    
    await testHealthCheck();
    await testWaitlistSignup();
    await testFreeSignup();
    
    console.log('🎉 All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testWaitlistSignup,
    testFreeSignup,
    testHealthCheck,
    runAllTests
};
