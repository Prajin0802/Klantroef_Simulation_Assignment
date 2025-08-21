// Simple test script to demonstrate API usage
// Run this after starting the server with: node test-api.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
const testUser = {
  email: 'admin@example.com',
  password: 'password123'
};

const testMedia = {
  title: 'Test Video',
  type: 'video'
};

async function testAPI() {
  console.log('🚀 Testing Media Platform API...\n');

  try {
    // 1. Test server is running
    console.log('1. Testing server connection...');
    const healthCheck = await axios.get(BASE_URL);
    console.log('✅ Server is running:', healthCheck.data.message);

    // 2. Test signup
    console.log('\n2. Testing admin signup...');
    const signupResponse = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    console.log('✅ Signup successful:', signupResponse.data.message);
    const token = signupResponse.data.token;

    // 3. Test login
    console.log('\n3. Testing admin login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testUser);
    console.log('✅ Login successful:', loginResponse.data.message);

    // 4. Test getting media list (requires auth)
    console.log('\n4. Testing media list (authenticated)...');
    const mediaListResponse = await axios.get(`${BASE_URL}/media`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Media list retrieved:', mediaListResponse.data.message);

    // 5. Test getting streaming URL for non-existent media
    console.log('\n5. Testing streaming URL generation...');
    try {
      const streamUrlResponse = await axios.get(`${BASE_URL}/media/999/stream-url`);
      console.log('❌ Expected error for non-existent media');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly handled non-existent media');
      }
    }

    // 6. Test logging a view for non-existent media
    console.log('\n6. Testing view logging for non-existent media...');
    try {
      const viewLogResponse = await axios.post(`${BASE_URL}/media/999/view`);
      console.log('❌ Expected error for non-existent media');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly handled view logging for non-existent media');
      }
    }

    // 7. Test analytics for non-existent media (requires auth)
    console.log('\n7. Testing analytics for non-existent media...');
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/media/999/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('❌ Expected error for non-existent media');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Correctly handled analytics for non-existent media');
      }
    }

    // 8. Test analytics without authentication
    console.log('\n8. Testing analytics without authentication...');
    try {
      const analyticsResponse = await axios.get(`${BASE_URL}/media/1/analytics`);
      console.log('❌ Expected authentication error');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Correctly required authentication for analytics');
      }
    }

    console.log('\n🎉 All basic tests passed!');
    console.log('\nTo test file upload, you can use tools like Postman or curl:');
    console.log('curl -X POST http://localhost:3000/media \\');
    console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('  -F "media=@your_video_file.mp4" \\');
    console.log('  -F "title=Your Video Title"');
    
    console.log('\nTo test analytics after uploading media:');
    console.log('1. Upload a media file first');
    console.log('2. Log some views: curl -X POST http://localhost:3000/media/1/view');
    console.log('3. Get analytics: curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/media/1/analytics');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI }; 