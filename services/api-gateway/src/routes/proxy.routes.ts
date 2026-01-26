import { Express, Request, Response } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { ClientRequest, IncomingMessage, ServerResponse } from 'http';

// Service URLs from environment
const SERVICE_URLS = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  tool: process.env.TOOL_SERVICE_URL || 'http://localhost:3002',
  lending: process.env.LENDING_SERVICE_URL || 'http://localhost:3003',
  neighborhood: process.env.NEIGHBORHOOD_SERVICE_URL || 'http://localhost:3004',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',
};

function createProxy(target: string, pathRewrite: Record<string, string>): Options {
  return {
    target,
    changeOrigin: true,
    pathRewrite,
    onProxyReq: (proxyReq: ClientRequest, req: IncomingMessage) => {
      // Forward user info headers from auth middleware
      if (req.headers['x-user-id']) {
        proxyReq.setHeader('x-user-id', req.headers['x-user-id'] as string);
      }
      if (req.headers['x-user-role']) {
        proxyReq.setHeader('x-user-role', req.headers['x-user-role'] as string);
      }
    },
    onError: (err: Error, req: IncomingMessage, res: ServerResponse) => {
      console.error('Proxy error:', err);
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Service temporarily unavailable',
      }));
    },
  };
}

export function setupProxyRoutes(app: Express): void {
  // Auth routes -> User Service
  app.use(
    '/api/auth',
    createProxyMiddleware(createProxy(SERVICE_URLS.user, { '^/api/auth': '/auth' }))
  );

  // User routes -> User Service
  app.use(
    '/api/users',
    createProxyMiddleware(createProxy(SERVICE_URLS.user, { '^/api/users': '/users' }))
  );

  // Tool routes -> Tool Service
  app.use(
    '/api/tools',
    createProxyMiddleware(createProxy(SERVICE_URLS.tool, { '^/api/tools': '/tools' }))
  );

  // Category routes -> Tool Service
  app.use(
    '/api/categories',
    createProxyMiddleware(createProxy(SERVICE_URLS.tool, { '^/api/categories': '/categories' }))
  );

  // Lending routes -> Lending Service
  app.use(
    '/api/lendings',
    createProxyMiddleware(createProxy(SERVICE_URLS.lending, { '^/api/lendings': '/lendings' }))
  );

  // Neighborhood routes -> Neighborhood Service
  app.use(
    '/api/neighborhoods',
    createProxyMiddleware(createProxy(SERVICE_URLS.neighborhood, { '^/api/neighborhoods': '/neighborhoods' }))
  );

  // Member routes -> Neighborhood Service
  app.use(
    '/api/members',
    createProxyMiddleware(createProxy(SERVICE_URLS.neighborhood, { '^/api/members': '/members' }))
  );

  // Notification admin routes (must be before /api/notifications)
  app.use(
    '/api/notifications/admin',
    createProxyMiddleware(createProxy(SERVICE_URLS.notification, { '^/api/notifications/admin': '/admin' }))
  );

  // Notification routes -> Notification Service
  app.use(
    '/api/notifications',
    createProxyMiddleware(createProxy(SERVICE_URLS.notification, { '^/api/notifications': '/notifications' }))
  );

  // Admin routes - aggregate from multiple services
  app.use(
    '/api/admin/users',
    createProxyMiddleware(createProxy(SERVICE_URLS.user, { '^/api/admin/users': '/users' }))
  );

  app.use(
    '/api/admin/smtp',
    createProxyMiddleware(createProxy(SERVICE_URLS.notification, { '^/api/admin/smtp': '/admin/smtp' }))
  );

  console.log('Proxy routes configured:', Object.keys(SERVICE_URLS));
}
