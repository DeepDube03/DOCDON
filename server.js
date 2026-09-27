/**
 * ============================================================================
 * DOCDON - Official Backend Server (Node.js Built-in Zero-Dependency Server)
 * ============================================================================
 * Provides real HTTP REST API endpoints and static file serving:
 * - POST /api/requests
 * - GET  /api/requests/:id
 * - GET  /api/requests
 * - POST /api/documents/upload
 * - GET  /api/documents/:id
 * - GET  /api/documents
 * - POST /api/documents/:id/verify
 * - GET  /api/documents/:id/verification
 * - POST /api/documents/:id/review
 * - POST /api/requests/:id/share
 * - GET  /api/audit/:requestId
 * - GET  /api/audit
 * - GET  /api/advisor/checklist
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Load Docdon Backend Module
const DocdonBackend = require('./docdon-backend.js');
const api = DocdonBackend.api;

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data, null, 2));
}

function parseRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ==========================================================================
  // REST API ROUTING LAYER
  // ==========================================================================
  if (pathname.startsWith('/api/')) {
    const body = (method === 'POST' || method === 'PUT') ? await parseRequestBody(req) : {};

    // 1. Advisor Checklist: GET /api/advisor/checklist?purpose=...
    if (pathname === '/api/advisor/checklist' && method === 'GET') {
      const result = api.getAdvisorChecklist(parsedUrl.query.purpose || '');
      return sendJson(res, 200, result);
    }

    // 2. Verification Requests: GET /api/requests, POST /api/requests
    if (pathname === '/api/requests' && method === 'GET') {
      const result = api.listRequests(parsedUrl.query.userId || null);
      return sendJson(res, 200, result);
    }

    if (pathname === '/api/requests' && method === 'POST') {
      const result = api.createVerificationRequest(body);
      return sendJson(res, 201, result);
    }

    // 3. Share Request: POST /api/requests/:id/share
    if (pathname.startsWith('/api/requests/') && pathname.endsWith('/share') && method === 'POST') {
      const reqId = pathname.split('/')[3];
      const result = api.shareDocument(reqId, body);
      return sendJson(res, result.success ? 200 : 400, result);
    }

    // 4. Single Request: GET /api/requests/:id
    if (pathname.startsWith('/api/requests/') && method === 'GET') {
      const reqId = pathname.split('/')[3];
      const result = api.getRequest(reqId);
      return sendJson(res, result.success ? 200 : 404, result);
    }

    // 5. Document Upload: POST /api/documents/upload
    if (pathname === '/api/documents/upload' && method === 'POST') {
      const result = await api.uploadDocument(body);
      return sendJson(res, result.success ? 201 : 400, result);
    }

    // 6. Documents List: GET /api/documents
    if (pathname === '/api/documents' && method === 'GET') {
      const result = api.getDocuments(parsedUrl.query.ownerId || null);
      return sendJson(res, 200, result);
    }

    // 7. Verify Document: POST /api/documents/:id/verify
    if (pathname.startsWith('/api/documents/') && pathname.endsWith('/verify') && method === 'POST') {
      const docId = pathname.split('/')[3];
      const result = await api.verifyDocument(docId, body);
      return sendJson(res, result.success ? 200 : 400, result);
    }

    // 8. Human Review Action: POST /api/documents/:id/review
    if (pathname.startsWith('/api/documents/') && pathname.endsWith('/review') && method === 'POST') {
      const docId = pathname.split('/')[3];
      const result = api.reviewDocument(docId, body);
      return sendJson(res, result.success ? 200 : 400, result);
    }

    // 9. Single Document: GET /api/documents/:id
    if (pathname.startsWith('/api/documents/') && method === 'GET') {
      const docId = pathname.split('/')[3];
      const doc = DocdonBackend.database.getDocumentById(docId);
      if (!doc) return sendJson(res, 404, { success: false, error: 'Document not found' });
      return sendJson(res, 200, { success: true, document: doc });
    }

    // 10. Audit Trail: GET /api/audit or GET /api/audit/:requestId
    if (pathname === '/api/audit' && method === 'GET') {
      const result = api.getAuditTrail(parsedUrl.query.requestId, parsedUrl.query.docId);
      return sendJson(res, 200, result);
    }

    if (pathname.startsWith('/api/audit/') && method === 'GET') {
      const reqId = pathname.split('/')[3];
      const result = api.getAuditTrail(reqId);
      return sendJson(res, 200, result);
    }

    return sendJson(res, 404, { success: false, error: 'API Endpoint Not Found' });
  }

  // ==========================================================================
  // STATIC FILE SERVING LAYER
  // ==========================================================================
  let safePath = pathname === '/' ? '/index.html' : pathname;
  safePath = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`DOCDON Verification Backend Server active on port ${PORT}`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

module.exports = server;
