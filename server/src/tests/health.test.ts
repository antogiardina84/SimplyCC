import request from 'supertest';
import app from '../app';

// Importa le funzioni globali di Jest
import { describe, it, expect } from '@jest/globals';

describe('Health Check API', () => {
  it('should return 200 and UP status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('status', 'UP');
    expect(response.body).toHaveProperty('timestamp');
  });
});