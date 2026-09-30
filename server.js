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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  // ==========================================================================
  // REST API ROUTING LAYER
  // ==========================================================================
  const isApiRoute = pathname.startsWith('/api/') || 
    pathname.startsWith('/requirements') || 
    pathname.startsWith('/document-checklist') || 
    pathname.startsWith('/document-progress') || 
    pathname.startsWith('/roadmap') || 
    pathname.startsWith('/profile') || 
    pathname.startsWith('/advisor/') || 
    (pathname.startsWith('/documents/') && (method === 'DELETE' || method === 'PATCH' || method === 'POST' || pathname.endsWith('/status') || pathname.endsWith('/check')));

  if (isApiRoute) {
    const apiPath = pathname.startsWith('/api/') ? pathname : ('/api' + (pathname.startsWith('/') ? pathname : '/' + pathname));
    const body = (method === 'POST' || method === 'PUT' || method === 'PATCH') ? await parseRequestBody(req) : {};

    // 0. User Profile: GET /api/profile, PUT /api/profile, PATCH /api/profile
    if (apiPath === '/api/profile' && method === 'GET') {
      const result = api.getUserProfile(parsedUrl.query.userId || 'david.miller');
      return sendJson(res, 200, result);
    }

    if (apiPath === '/api/profile' && (method === 'PUT' || method === 'PATCH' || method === 'POST')) {
      const userId = body.userId || parsedUrl.query.userId || 'david.miller';
      const result = api.updateUserProfile(userId, body);
      return sendJson(res, 200, result);
    }

    // 0a. Requirements Status Breakdown: GET /api/requirements/status
    if (apiPath === '/api/requirements/status' && method === 'GET') {
      const userId = parsedUrl.query.userId || 'david.miller';
      const result = api.getRequirementsStatus(userId, parsedUrl.query);
      return sendJson(res, 200, result);
    }

    // 0b. Dynamic Requirements: GET /api/requirements
    if (apiPath === '/api/requirements' && method === 'GET') {
      const userId = parsedUrl.query.userId || 'david.miller';
      const result = api.getRequirements(userId, parsedUrl.query);
      return sendJson(res, 200, result);
    }

    // 0c. Document Checklist: GET /api/document-checklist
    if (apiPath === '/api/document-checklist' && method === 'GET') {
      const userId = parsedUrl.query.userId || 'david.miller';
      const result = api.getDocumentChecklist(userId, parsedUrl.query);
      return sendJson(res, 200, result);
    }

    // 0d. Document Progress: GET /api/document-progress
    if (apiPath === '/api/document-progress' && method === 'GET') {
      const userId = parsedUrl.query.userId || 'david.miller';
      const result = api.getDocumentProgress(userId, parsedUrl.query);
      return sendJson(res, 200, result);
    }

    // 0e. Dynamic Roadmap: GET /api/roadmap
    if (apiPath === '/api/roadmap' && method === 'GET') {
      const userId = parsedUrl.query.userId || 'david.miller';
      const result = api.getRoadmap(userId, parsedUrl.query);
      return sendJson(res, 200, result);
    }

    // 1. Advisor Checklist: GET /api/advisor/checklist?purpose=...
    if (apiPath === '/api/advisor/checklist' && method === 'GET') {
      const result = api.getAdvisorChecklist(parsedUrl.query.purpose || '', parsedUrl.query);
      return sendJson(res, 200, result);
    }

    // 1b. Advisor Consultation: POST /api/advisor/consult or POST /api/advisor/chat
    if ((apiPath === '/api/advisor/consult' || apiPath === '/api/advisor/chat') && method === 'POST') {
      const result = api.consultAdvisor(body);
      return sendJson(res, 200, result);
    }

    // 2. Verification Requests: GET /api/requests, POST /api/requests
    if (apiPath === '/api/requests' && method === 'GET') {
      const result = api.listRequests(parsedUrl.query.userId || null);
      return sendJson(res, 200, result);
    }

    if (apiPath === '/api/requests' && method === 'POST') {
      const result = api.createVerificationRequest(body);
      return sendJson(res, 201, result);
    }

    // 3. Share Request: POST /api/requests/:id/share
    if (apiPath.startsWith('/api/requests/') && apiPath.endsWith('/share') && method === 'POST') {
      const reqId = apiPath.split('/')[3];
      const result = api.shareDocument(reqId, body);
      return sendJson(res, result.success ? 200 : 400, result);
    }

    // 3b. Direct Vault Shares: GET /api/shares, POST /api/shares, POST /api/shares/:token/revoke, GET /api/shares/:token
    if (apiPath === '/api/shares' && method === 'GET') {
      const result = api.listShares(parsedUrl.query.documentId || null, parsedUrl.query.ownerId || null);
      return sendJson(res, 200, result);
    }

    if (apiPath === '/api/shares' && method === 'POST') {
      const result = api.shareDocument(body);
      return sendJson(res, result.success ? 201 : 400, result);
    }

    if (apiPath.startsWith('/api/shares/') && apiPath.endsWith('/revoke') && method === 'POST') {
      const token = apiPath.split('/')[3];
      const result = api.revokeShare(token, body);
      return sendJson(res, result.success ? 200 : 400, result);
    }

    if (apiPath.startsWith('/api/shares/') && method === 'GET') {
      const token = apiPath.split('/')[3];
      const result = api.getSharedDocument(token);
      const statusCode = result.success ? 200 : (result.status === 'revoked' || result.status === 'expired' || result.status === 'integrity_failure' ? 403 : (result.status === 'not_found' ? 404 : 400));
      return sendJson(res, statusCode, result);
    }

    // 4. Single Request: GET /api/requests/:id
    if (apiPath.startsWith('/api/requests/') && method === 'GET') {
      const reqId = apiPath.split('/')[3];
      const result = api.getRequest(reqId);
      return sendJson(res, result.success ? 200 : 404, result);
    }

    // 5. Document Upload: POST /api/documents/upload
    if (apiPath === '/api/documents/upload' && method === 'POST') {
      const result = await api.uploadDocument(body);
      return sendJson(res, result.success ? 201 : 400, result);
    }

    // 6. Documents List: GET /api/documents
    if (apiPath === '/api/documents' && method === 'GET') {
      const result = api.getDocuments(parsedUrl.query.ownerId || null);
      return sendJson(res, 200, result);
    }

    // 7. Verify Document: POST /api/documents/:id/verify
    if (apiPath.startsWith('/api/documents/') && apiPath.endsWith('/verify') && method === 'POST') {
      const docId = apiPath.split('/')[3];
      const result = await api.verifyDocument(docId, body);
      return sendJson(res, result.success ? 200 : 400, result);
    }

    // 7b. Check Document: POST /api/documents/:id/check
    if (apiPath.startsWith('/api/documents/') && apiPath.endsWith('/check') && method === 'POST') {
      const docId = apiPath.split('/')[3];
      const result = await api.checkDocument(docId, body);
      return sendJson(res, result.success ? 200 : 400, result);
    }

    // 8. Human Review Action: POST /api/documents/:id/review
    if (apiPath.startsWith('/api/documents/') && apiPath.endsWith('/review') && method === 'POST') {
      const docId = apiPath.split('/')[3];
      const result = api.reviewDocument(docId, body);
      return sendJson(res, result.success ? 200 : 400, result);
    }

    // 8b. Document Vault Status: GET /api/documents/:id/status
    if (apiPath.startsWith('/api/documents/') && apiPath.endsWith('/status') && method === 'GET') {
      const docId = apiPath.split('/')[3];
      const userId = parsedUrl.query.userId || 'david.miller';
      const result = api.getDocumentStatus(docId, userId);
      return sendJson(res, result.success ? 200 : 404, result);
    }

    // 8c. Patch Document: PATCH /api/documents/:id
    if (apiPath.startsWith('/api/documents/') && method === 'PATCH') {
      const docId = apiPath.split('/')[3];
      const result = api.patchDocument(docId, body);
      return sendJson(res, result.success ? 200 : 404, result);
    }

    // 9. Single Document: GET /api/documents/:id
    if (apiPath.startsWith('/api/documents/') && method === 'GET') {
      const docId = apiPath.split('/')[3];
      const doc = DocdonBackend.database.getDocumentById(docId);
      if (!doc) return sendJson(res, 404, { success: false, error: 'Document not found' });
      return sendJson(res, 200, { success: true, document: doc });
    }

    // 9b. Delete Document: DELETE /api/documents/:id
    if (apiPath.startsWith('/api/documents/') && method === 'DELETE') {
      const docId = apiPath.split('/')[3];
      const result = api.deleteDocument ? api.deleteDocument(docId) : { success: true };
      return sendJson(res, 200, result);
    }

    // 10. Audit Trail: GET /api/audit or GET /api/audit/:requestId
    if (apiPath === '/api/audit' && method === 'GET') {
      const result = api.getAuditTrail(parsedUrl.query.requestId, parsedUrl.query.docId);
      return sendJson(res, 200, result);
    }

    if (apiPath.startsWith('/api/audit/') && method === 'GET') {
      const reqId = apiPath.split('/')[3];
      const result = api.getAuditTrail(reqId);
      return sendJson(res, 200, result);
    }

    return sendJson(res, 404, { success: false, error: 'API Endpoint Not Found' });
  }

  // ==========================================================================
  // STATIC FILE SERVING LAYER
  // ==========================================================================
  // Do not allow direct access to raw uploaded vault files without valid share authorization
  const normalizedPath = pathname.replace(/\\/g, '/');
  if (normalizedPath.startsWith('/uploads/') || normalizedPath === '/uploads') {
    const shareToken = parsedUrl.query.token || parsedUrl.query.share_token;
    if (!shareToken) {
      return sendJson(res, 403, {
        success: false,
        error: 'Access Denied: Direct access to underlying raw vault files is forbidden without a valid share authorization token.'
      });
    }
    const shareCheck = api.getSharedDocument(shareToken);
    if (!shareCheck.success) {
      const code = (shareCheck.status === 'revoked' || shareCheck.status === 'expired' || shareCheck.status === 'integrity_failure') ? 403 : (shareCheck.status === 'not_found' ? 404 : 400);
      return sendJson(res, code, {
        success: false,
        error: shareCheck.error,
        status: shareCheck.status
      });
    }
  }

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
