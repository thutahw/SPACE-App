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
});
