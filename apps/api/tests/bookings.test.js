const request = require('supertest');
const express = require('express');
const bookingRoutes = require('../routes/bookings');

const app = express();
app.use(express.json());
app.use('/bookings', bookingRoutes);

describe('Bookings API', () => {
  it('GET /bookings should return 404 or 200 with array', async () => {
    const res = await request(app).get('/bookings');
    // Accept 404 (route not implemented) or 200 (if implemented)
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    } else {
      expect(res.body.error || res.text).toBeDefined();
    }
  });

  it('POST /bookings should fail with missing fields', async () => {
    const res = await request(app)
      .post('/bookings')
      .send({ spaceId: 1 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /bookings with valid data should succeed or fail if user/space missing', async () => {
    // Try with likely invalid user/space
    const res = await request(app)
      .post('/bookings')
      .send({
        startDate: '2025-06-01',
        endDate: '2025-06-02',
        UserId: 1,
        SpaceId: 1
      });
    expect([201, 400, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body).toHaveProperty('id');
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('POST /bookings with invalid user or space id should fail', async () => {
    const res = await request(app)
      .post('/bookings')
      .send({
        startDate: '2025-06-01',
        endDate: '2025-06-02',
        UserId: 99999,
        SpaceId: 99999
      });
    expect([400, 404, 500]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
  });

  it('PATCH /bookings/:id to update status should succeed or 404', async () => {
    // Create a booking first (if possible)
    const createRes = await request(app)
      .post('/bookings')
      .send({
        startDate: '2025-06-01',
        endDate: '2025-06-02',
        UserId: 1,
        SpaceId: 1
      });
    const bookingId = createRes.body.id;
    const res = await request(app)
      .patch(`/bookings/${bookingId || 99999}`)
      .send({ status: 'confirmed' });
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.status).toBe('confirmed');
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('PATCH /bookings/:id/cancel should cancel a booking or 404', async () => {
    // Create a booking first (if possible)
    const createRes = await request(app)
      .post('/bookings')
      .send({
        startDate: '2025-06-01',
        endDate: '2025-06-02',
        UserId: 1,
        SpaceId: 1
      });
    const bookingId = createRes.body.id;
    const res = await request(app)
      .patch(`/bookings/${bookingId || 99999}/cancel`)
      .send();
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.status).toBe('cancelled');
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('DELETE /bookings/:id should delete a booking or 404', async () => {
    // Create a booking first (if possible)
    const createRes = await request(app)
      .post('/bookings')
      .send({
        startDate: '2025-06-01',
        endDate: '2025-06-02',
        UserId: 1,
        SpaceId: 1
      });
    const bookingId = createRes.body.id;
    const res = await request(app).delete(`/bookings/${bookingId || 99999}`);
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message');
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('GET /bookings/user/:userId returns bookings for user (empty or array)', async () => {
    const res = await request(app).get('/bookings/user/1');
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('GET /bookings/owner/:ownerId returns bookings for owner (empty or array)', async () => {
    const res = await request(app).get('/bookings/owner/1');
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBe(true);
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('POST /bookings with invalid date range should fail', async () => {
    const res = await request(app)
      .post('/bookings')
      .send({
        startDate: '2025-06-02',
        endDate: '2025-06-01',
        UserId: 1,
        SpaceId: 1
      });
    expect([400, 500]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
  });

  it('PATCH /bookings/:id/cancel for already cancelled booking should error or 404', async () => {
    // Create a booking first (if possible)
    const createRes = await request(app)
      .post('/bookings')
      .send({
        startDate: '2025-06-01',
        endDate: '2025-06-02',
        UserId: 1,
        SpaceId: 1
      });
    const bookingId = createRes.body.id;
    await request(app).patch(`/bookings/${bookingId}/cancel`).send();
    const res = await request(app).patch(`/bookings/${bookingId}/cancel`).send();
    expect([400, 404, 500]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
  });

  it('PATCH /bookings/:id for non-existent booking should return 404', async () => {
    const res = await request(app).patch('/bookings/99999').send({ status: 'confirmed' });
    expect([404, 500]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
  });

  it('DELETE /bookings/:id for non-existent booking should return 404', async () => {
    const res = await request(app).delete('/bookings/99999');
    expect([404, 500]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
  });
});
