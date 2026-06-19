// corsConfig.ts coverage
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { corsMiddleware } from '../../security/corsConfig.js';

function makeCorsApp(): Express {
  const app = express();
  app.use(corsMiddleware);
  app.get('/test', (_req, res) => res.json({ ok: true }));
  app.post('/test', (_req, res) => res.json({ ok: true }));
  return app;
}

afterAll(() => {
  delete process.env['ALLOWED_ORIGINS'];
});

describe('corsMiddleware — allowed origins', () => {
  it('allows requests with no Origin header (same-origin / server-to-server)', async () => {
    const app = makeCorsApp();
    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
  });

  it('allows localhost:3000', async () => {
    const app = makeCorsApp();
    const res = await request(app).get('/test').set('Origin', 'http://localhost:3000');
    expect(res.status).toBe(200);
  });

  it('allows localhost:5173 (Vite default dev port)', async () => {
    const app = makeCorsApp();
    const res = await request(app).get('/test').set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
  });

  it('allows *.replit.app domain (single subdomain)', async () => {
    const app = makeCorsApp();
    // Matches: /^https?:\/\/[a-zA-Z0-9-]+\.replit\.app$/
    const res = await request(app).get('/test').set('Origin', 'https://myapp.replit.app');
    expect(res.status).toBe(200);
  });

  it('allows *.repl.co domain (single subdomain)', async () => {
    const app = makeCorsApp();
    // Matches: /^https?:\/\/[a-zA-Z0-9-]+\.repl\.co$/
    const res = await request(app).get('/test').set('Origin', 'https://project.repl.co');
    expect(res.status).toBe(200);
  });

  it('allows *.replit.dev domain (single subdomain)', async () => {
    const app = makeCorsApp();
    // Matches: /^https?:\/\/[a-zA-Z0-9-]+\.replit\.dev$/
    const res = await request(app).get('/test').set('Origin', 'https://abc123.replit.dev');
    expect(res.status).toBe(200);
  });

  it('handles OPTIONS preflight with allowed origin', async () => {
    const app = makeCorsApp();
    const res = await request(app)
      .options('/test')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST');
    expect([200, 204]).toContain(res.status);
  });

  it('includes Access-Control-Allow-Origin header for allowed origin', async () => {
    const app = makeCorsApp();
    const res = await request(app).get('/test').set('Origin', 'http://localhost:3000');
    expect(res.headers['access-control-allow-origin']).toBeTruthy();
  });

  it('blocks requests from non-allowed origins', async () => {
    const app = makeCorsApp();
    const res = await request(app).get('/test').set('Origin', 'https://evil.attacker.com');
    // CORS blocked origin results in 500 (Error thrown in cors callback) or non-OK
    expect(res.status).not.toBe(200);
  });

  it('allows extra prod origin configured via ALLOWED_ORIGINS env', async () => {
    process.env['ALLOWED_ORIGINS'] = 'https://myprod.example.com';
    const app = makeCorsApp();
    const res = await request(app).get('/test').set('Origin', 'https://myprod.example.com');
    expect(res.status).toBe(200);
    delete process.env['ALLOWED_ORIGINS'];
  });
});
