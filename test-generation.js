#!/usr/bin/env node

/**
 * Test script to check comic generation API
 */

const axios = require('axios');
const FormData = require('form-data');

async function testComicGeneration() {
  try {
    console.log('🧪 Testing comic generation API...');
    
    // Step 1: Login to get token
    console.log('1. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'user4@user.com',
      password: 'Allr1ght!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Step 2: Get templates
    console.log('2. Getting templates...');
    const templatesResponse = await axios.get('http://localhost:3001/api/templates');
    const templates = templatesResponse.data.data;
    
    if (templates.length === 0) {
      console.log('❌ No templates found');
      return;
    }
    
    const template = templates[0];
    console.log(`✅ Using template: ${template.name} (${template.panelCount} panels)`);
    
    // Step 3: Test comic generation
    console.log('3. Testing comic generation...');
    const formData = new FormData();
    formData.append('prompt', 'A brave cat saves a mouse from a dragon in a magical forest');
    formData.append('genre', 'fantasy');
    formData.append('style', 'cartoon');
    formData.append('panelCount', template.panelCount.toString());
    formData.append('templateId', template.id);
    
    const generationResponse = await axios.post(
      'http://localhost:3001/api/comics/generate',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Comic generation successful!');
    console.log('Comic ID:', generationResponse.data.data.comic.id);
    console.log('Job ID:', generationResponse.data.data.jobId);
    console.log('Status:', generationResponse.data.data.comic.status);
    
  } catch (error) {
    console.error('❌ Error testing comic generation:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message || error.response.data);
      console.error('Details:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testComicGeneration();