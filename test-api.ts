// A simple script to test your API route against the running `vercel dev` server.
// Make sure `vercel dev` is running before you execute this.
// You can run this file using `npx tsx test-api.ts` or similar.

async function run() {
  try {
    console.log("Sending request to http://localhost:3000/api/create-payment-intent...");
    
    const response = await fetch('http://localhost:3000/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cart: {},
        customBuilds: [],
        config: null
      })
    });
    
    const data = await response.json();
    
    console.log(`\nResponse Status: ${response.status}`);
    console.log(`Response Data:`, JSON.stringify(data, null, 2));
    
  } catch (e) {
    console.error("Test script failed:", e);
  }
}

run();
