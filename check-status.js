#!/usr/bin/env node

const axios = require('axios');

async function checkStatus() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'user4@user.com',
      password: 'Allr1ght!'
    });
    
    const token = loginResponse.data.data.token;
    
    // Check status of the latest comic
    const statusResponse = await axios.get('http://localhost:3001/api/comics/cmecvvwz70001d80478pi5yjm/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Comic status:', JSON.stringify(statusResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

checkStatus();