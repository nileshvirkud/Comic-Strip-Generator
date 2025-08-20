#!/usr/bin/env node

/**
 * Comprehensive test script to verify the entire comic generation workflow
 */

const axios = require('axios');
const FormData = require('form-data');

async function testFullWorkflow() {
  try {
    console.log('🎯 Testing full comic generation workflow...\n');
    
    // Step 1: Health check
    console.log('1. Checking backend health...');
    const healthResponse = await axios.get('http://localhost:3001/api/health');
    console.log('✅ Backend health check passed');
    console.log(`   Overall status: ${healthResponse.data.overall}`);
    
    // Step 2: Login
    console.log('\n2. Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'user4@user.com',
      password: 'Allr1ght!'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Step 3: Get templates
    console.log('\n3. Fetching available templates...');
    const templatesResponse = await axios.get('http://localhost:3001/api/templates');
    const templates = templatesResponse.data.data;
    
    if (templates.length === 0) {
      console.log('❌ No templates found');
      return;
    }
    
    console.log('✅ Templates fetched successfully');
    templates.forEach((template, index) => {
      console.log(`   ${index + 1}. ${template.name} (${template.panelCount} panels)`);
    });
    
    // Step 4: Test comic generation with different templates
    console.log('\n4. Testing comic generation...');
    
    const testCases = [
      {
        template: templates[0],
        prompt: 'A heroic cat saves a village from a dragon using magical powers',
        genre: 'fantasy',
        style: 'cartoon'
      },
      {
        template: templates[1] || templates[0],
        prompt: 'A robot learns to dance and brings joy to a lonely city',
        genre: 'sci-fi',
        style: 'modern'
      }
    ];
    
    const generatedComics = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n   Test ${i + 1}: ${testCase.prompt.substring(0, 50)}...`);
      
      try {
        const formData = new FormData();
        formData.append('prompt', testCase.prompt);
        formData.append('genre', testCase.genre);
        formData.append('style', testCase.style);
        formData.append('panelCount', testCase.template.panelCount.toString());
        formData.append('templateId', testCase.template.id);
        
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
        
        const comic = generationResponse.data.data.comic;
        generatedComics.push(comic);
        
        console.log(`   ✅ Comic generation started successfully`);
        console.log(`      Comic ID: ${comic.id}`);
        console.log(`      Status: ${comic.status}`);
        console.log(`      Template: ${testCase.template.name}`);
        
      } catch (error) {
        console.log(`   ❌ Comic generation failed:`);
        if (error.response) {
          console.log(`      Status: ${error.response.status}`);
          console.log(`      Message: ${error.response.data.message || error.response.data}`);
        } else {
          console.log(`      Error: ${error.message}`);
        }
      }
    }
    
    // Step 5: Test getting user's comics
    console.log('\n5. Testing user comics retrieval...');
    try {
      const userComicsResponse = await axios.get('http://localhost:3001/api/comics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const userComics = userComicsResponse.data.data.comics;
      console.log(`✅ User comics retrieved successfully`);
      console.log(`   Total comics: ${userComics.length}`);
      
      if (userComics.length > 0) {
        console.log('   Recent comics:');
        userComics.slice(0, 3).forEach((comic, index) => {
          console.log(`      ${index + 1}. ${comic.title} (${comic.status})`);
        });
      }
      
    } catch (error) {
      console.log('❌ Failed to retrieve user comics');
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Message: ${error.response.data.message || error.response.data}`);
      }
    }
    
    // Step 6: Test comic status checking
    if (generatedComics.length > 0) {
      console.log('\n6. Testing comic status checking...');
      const comic = generatedComics[0];
      
      try {
        const statusResponse = await axios.get(`http://localhost:3001/api/comics/${comic.id}/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const status = statusResponse.data.data;
        console.log('✅ Comic status retrieved successfully');
        console.log(`   Status: ${status.status}`);
        console.log(`   Progress: ${status.progress}%`);
        console.log(`   Jobs: ${status.jobs.length}`);
        
      } catch (error) {
        console.log('❌ Failed to check comic status');
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Message: ${error.response.data.message || error.response.data}`);
        }
      }
    }
    
    // Step 7: Test comic retrieval
    if (generatedComics.length > 0) {
      console.log('\n7. Testing individual comic retrieval...');
      const comic = generatedComics[0];
      
      try {
        const comicResponse = await axios.get(`http://localhost:3001/api/comics/${comic.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const fullComic = comicResponse.data.data;
        console.log('✅ Comic retrieved successfully');
        console.log(`   Title: ${fullComic.title}`);
        console.log(`   Status: ${fullComic.status}`);
        console.log(`   Panels: ${fullComic.panels ? fullComic.panels.length : 0}`);
        console.log(`   Template: ${fullComic.template ? fullComic.template.name : 'N/A'}`);
        
      } catch (error) {
        console.log('❌ Failed to retrieve comic');
        if (error.response) {
          console.log(`   Status: ${error.response.status}`);
          console.log(`   Message: ${error.response.data.message || error.response.data}`);
        }
      }
    }
    
    console.log('\n🎉 Full workflow test completed!');
    console.log('\n📊 Summary:');
    console.log(`   Comics generated: ${generatedComics.length}`);
    console.log(`   Templates available: ${templates.length}`);
    console.log('   All critical endpoints tested ✅');
    
  } catch (error) {
    console.error('\n❌ Workflow test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message || error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testFullWorkflow();