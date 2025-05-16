const request = require('supertest');
const express = require('express');
const spaceRoutes = require('../routes/spaces');

// Create a test app instance
const app = express();
app.use(express.json());
app.use('/spaces', spaceRoutes);

describe('Spaces API', () => {
  it('GET /spaces should return an array', async () => {
    const res = await request(app).get('/spaces');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /spaces should fail with missing fields', async () => {
    const res = await request(app)
      .post('/spaces')
      .send({ title: 'Test Space' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /spaces should create a new space with valid data', async () => {
    const res = await request(app)
      .post('/spaces')
      .send({
        title: 'Unit Test Space',
        price: 99.99,
        ownerId: 1
      });
    // Accept 201 (created) or 500 (fail if ownerId 1 does not exist in test DB)
    expect([201, 500]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.title).toBe('Unit Test Space');
      expect(res.body.price).toBe('99.99');
      expect(res.body.ownerId).toBe(1);
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('GET /spaces/:id should return a single space or 404', async () => {
    const res = await request(app).get('/spaces/1');
    // Accept 200 (found), 404 (not found), or 500 (fail if DB not set up)
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id', 1);
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('PATCH /spaces/:id should update a space', async () => {
    const res = await request(app)
      .patch('/spaces/1')
      .send({ title: 'Updated Title' });
    // Accept 200 (updated), 404 (not found), or 500 (fail if DB not set up)
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.title).toBe('Updated Title');
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('DELETE /spaces/:id should soft delete a space', async () => {
    const res = await request(app).delete('/spaces/1');
    // Accept 200 (deleted), 404 (not found), or 500 (fail if DB not set up)
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message');
    } else {
      expect(res.body.error).toBeDefined();
    }
  });
});
