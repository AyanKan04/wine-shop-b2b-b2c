const http = require('http');

const data = JSON.stringify({
  sender_name: 'Test Buyer',
  sender_role: 'BUYER',
  message_text: '@ai Tư vấn giúp tôi một chai vang Pháp nào ngon để tặng đối tác quan trọng nhé.'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/rfqs/1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', responseData);
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});

req.write(data);
req.end();
