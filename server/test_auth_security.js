import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getUserByEmail, getUserById } from './models/user.model.js';
import { login, getMe } from './controllers/auth.controller.js';
import { protect, authorize } from './middleware/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

// Mock Express req, res
const createMockReqRes = ({ body = {}, headers = {}, user = null, params = {}, query = {} } = {}) => {
  const req = {
    body,
    headers,
    user,
    params,
    query
  };
  let responseData = null;
  let statusCode = 200;
  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    getStatusCode: () => statusCode,
    getData: () => responseData
  };
  return { req, res, next: (err) => { if (err) req.err = err; } };
};

async function runTests() {
  console.log('🧪 Starting Authentication & Authorization Security Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
    }
  }

  // Case 1: Correct email + correct password -> SUCCESS
  {
    const { req, res, next } = createMockReqRes({
      body: { email: 'admin@kopargaon.gov.in', password: 'admin123' }
    });
    await login(req, res, next);
    const data = res.getData();
    assert(res.getStatusCode() === 200 && data.success && data.token && data.user.email === 'admin@kopargaon.gov.in', 'Case 1: Correct email + correct password -> SUCCESS');
  }

  // Case 2: Correct email + wrong password -> FAIL (401)
  {
    const { req, res, next } = createMockReqRes({
      body: { email: 'admin@kopargaon.gov.in', password: 'wrongpassword' }
    });
    await login(req, res, next);
    const data = res.getData();
    assert(res.getStatusCode() === 401 && !data.success && data.message === 'Invalid email or password', 'Case 2: Correct email + wrong password -> FAIL (401)');
  }

  // Case 3: Wrong email + correct password -> FAIL (401)
  {
    const { req, res, next } = createMockReqRes({
      body: { email: 'nonexistent@kopargaon.gov.in', password: 'admin123' }
    });
    await login(req, res, next);
    const data = res.getData();
    assert(res.getStatusCode() === 401 && !data.success && data.message === 'Invalid email or password', 'Case 3: Wrong email + correct password -> FAIL (401)');
  }

  // Case 4: Wrong email + wrong password -> FAIL (401)
  {
    const { req, res, next } = createMockReqRes({
      body: { email: 'wrong@example.com', password: 'wrong' }
    });
    await login(req, res, next);
    const data = res.getData();
    assert(res.getStatusCode() === 401 && !data.success && data.message === 'Invalid email or password', 'Case 4: Wrong email + wrong password -> FAIL (401)');
  }

  // Case 5: Admin login -> only that admin's account identity & role
  let adminToken = null;
  {
    const { req, res, next } = createMockReqRes({
      body: { email: 'ADMIN@kopargaon.gov.in ', password: 'admin123' }
    });
    await login(req, res, next);
    const data = res.getData();
    adminToken = data.token;
    assert(res.getStatusCode() === 200 && data.user.role === 'Admin' && data.user.id === 'U1', 'Case 5: Admin login -> Returns only that admin account & role (handles whitespace/case normalization)');
  }

  // Case 6: Citizen login -> only that citizen's account identity & role
  let citizenToken = null;
  {
    const { req, res, next } = createMockReqRes({
      body: { email: 'citizen@gmail.com', password: 'citizen' }
    });
    await login(req, res, next);
    const data = res.getData();
    citizenToken = data.token;
    assert(res.getStatusCode() === 200 && data.user.role === 'Citizen' && data.user.id === 'CIT-1', 'Case 6: Citizen login -> Returns only that citizen account & role');
  }

  // Case 7: Business login -> only that business account identity & role
  let businessToken = null;
  {
    const { req, res, next } = createMockReqRes({
      body: { email: 'business@gmail.com', password: 'business' }
    });
    await login(req, res, next);
    const data = res.getData();
    businessToken = data.token;
    assert(res.getStatusCode() === 200 && data.user.role === 'Business' && data.user.id === 'BIZ-1', 'Case 7: Business login -> Returns only that business account & role');
  }

  // Case 8: JWT payload verification and protect middleware
  {
    const { req, res, next } = createMockReqRes({
      headers: { authorization: `Bearer ${adminToken}` }
    });
    let calledNext = false;
    await protect(req, res, () => { calledNext = true; });
    assert(calledNext && req.user && req.user.id === 'U1' && req.user.role === 'Admin', 'Case 8: Protect middleware extracts and validates authenticated Admin');
  }

  // Case 9: Citizen attempting admin API -> 403 Access denied
  {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${citizenToken}` }
    });
    let calledNext = false;
    await protect(req, res, () => { calledNext = true; });
    
    // Now test authorize('Admin')
    let authNext = false;
    const authMiddleware = authorize('Admin', 'Officer');
    authMiddleware(req, res, () => { authNext = true; });
    
    const data = res.getData();
    assert(!authNext && res.getStatusCode() === 403 && data.message === 'Access denied', 'Case 9: Citizen attempting Admin-only API route -> 403 Access denied');
  }

  // Case 10: Admin attempting admin API -> 200 allowed
  {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer ${adminToken}` }
    });
    await protect(req, res, () => {});
    
    let authNext = false;
    const authMiddleware = authorize('Admin', 'Officer');
    authMiddleware(req, res, () => { authNext = true; });
    
    assert(authNext, 'Case 10: Admin accessing Admin API route -> Allowed through');
  }

  // Case 11: Invalid/tampered token -> 401
  {
    const { req, res } = createMockReqRes({
      headers: { authorization: `Bearer invalid.tampered.token` }
    });
    let calledNext = false;
    await protect(req, res, () => { calledNext = true; });
    const data = res.getData();
    assert(!calledNext && res.getStatusCode() === 401 && data.message.includes('token failed'), 'Case 11: Invalid/tampered token -> 401 Unauthorized');
  }

  // Case 12: No token on protected route -> 401
  {
    const { req, res } = createMockReqRes({
      headers: {}
    });
    let calledNext = false;
    await protect(req, res, () => { calledNext = true; });
    const data = res.getData();
    assert(!calledNext && res.getStatusCode() === 401 && data.message.includes('no token'), 'Case 12: No token provided on protected route -> 401 Unauthorized');
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} / ${total} Tests Passed!`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error('Test execution error:', e);
  process.exit(1);
});
