const axios = require('axios');

// Manually define the URL since we are running in Node without Next.js env loading in this simple script
const API_URL = 'http://localhost:3000/api/test';

async function testApi() {
    try {
        console.log(`Testing API at ${API_URL}...`);
        const response = await axios.get(API_URL);
        console.log('Success! Response:', response.data);
    } catch (error) {
        console.error('Error connecting to API:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

testApi();
