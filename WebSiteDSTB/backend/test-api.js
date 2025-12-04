// Test API endpoints
const http = require('http');

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
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
  console.log('Testing Admin API...\n');

  // Test 1: Login
  console.log('1. Testing login...');
  const loginRes = await request('POST', '/api/admin/login', {
    username: 'admin',
    password: 'password123'
  });
  console.log('Status:', loginRes.status);
  console.log('Response:', loginRes.data);
  
  if (loginRes.data.token) {
    const token = loginRes.data.token;
    console.log('✓ Login successful, token:', token.substring(0, 20) + '...\n');

    // Test 2: Get me
    console.log('2. Testing GET /api/admin/me with token...');
    const meRes = await request('GET', '/api/admin/me', null, token);
    console.log('Status:', meRes.status);
    console.log('Response:', meRes.data, '\n');

    // Test 3: Add product
    console.log('3. Testing POST /api/admin/products...');
    const addRes = await request('POST', '/api/admin/products', {
      name: 'Test Product',
      price: 100000,
      category: 'Thịt Gác Bếp',
      description: 'Test',
      image: '/images/products/trau_gac_bep.jpg'
    }, token);
    console.log('Status:', addRes.status);
    console.log('Response:', addRes.data, '\n');
  }

  // Test 4: Get products
  console.log('4. Testing GET /api/products...');
  const productsRes = await request('GET', '/api/products', null);
  console.log('Status:', productsRes.status);
  console.log('Products count:', productsRes.data?.length);
  if (productsRes.data && productsRes.data.length > 0) {
    console.log('First product:', JSON.stringify(productsRes.data[0], null, 2));
  }

  console.log('\n✓ All tests completed');
  process.exit(0);
}

test().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
