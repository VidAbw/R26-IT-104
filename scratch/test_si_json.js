const http = require('http');

async function testSinhalaDetail() {
  const data = JSON.stringify({ description: "වයස අවුරුදු 10ක දරුවෙකුට පහර දී ශාරීරික හානි සිදු කර ඇත.", language: "si" });
  return new Promise((resolve) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/rag/query',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(JSON.stringify(JSON.parse(body), null, 2));
        resolve();
      });
    });
    req.write(data);
    req.end();
  });
}

testSinhalaDetail();
