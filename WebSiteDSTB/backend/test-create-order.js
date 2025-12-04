const http = require('http');

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 4000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function test() {
  console.log('Testing Create Order API...\n');

  // Login first
  const loginRes = await request('POST', '/api/admin/login', {
    username: 'admin',
    password: 'password123'
  });
  
  if (!loginRes.data.token) {
    console.log('Login failed:', loginRes.data);
    process.exit(1);
  }

  const token = loginRes.data.token;
  console.log('✓ Login successful\n');

  // Test create order
  console.log('Testing POST /api/admin/orders...');
  const createRes = await request('POST', '/api/admin/orders', {
    customer_name: 'Test Customer',
    customer_phone: '0123456789',
    customer_address: 'Test Address',
    items_json: [
      { id: 'P1', name: 'Thịt gác bếp - 200g', price: 100000, qty: 1 }
    ],
    subtotal: 100000,
    shipping: 30000,
    discount: 0,
    total: 130000,
    method: 'COD',
    paid: false
  }, token);

  console.log('Status:', createRes.status);
  console.log('Response:', JSON.stringify(createRes.data, null, 2));

  if (createRes.status === 200) {
    console.log('\n✓ Create order successful!');
  }

  process.exit(0);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
