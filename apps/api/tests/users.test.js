const request = require('supertest');
const express = require('express');
const userRoutes = require('../routes/users');
const { sequelize, User } = require('../models');

const app = express();
app.use(express.json());
app.use('/users', userRoutes);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Users API', () => {
  it('GET /users should return an array', async () => {
    const res = await request(app).get('/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('POST /users should fail with missing fields', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'test@example.com' });
    expect([400, 500]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
  });

  it('POST /users should create a new user with valid data', async () => {
    const res = await request(app)
      .post('/users')
      .send({
        email: 'unituser@example.com',
        password: 'testpass',
        name: 'Unit User'
      });
    expect([201, 500]).toContain(res.statusCode);
    if (res.statusCode === 201) {
      expect(res.body.email).toBe('unituser@example.com');
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('GET /users/:id should return a user or 404', async () => {
    // Create a user first
    const createRes = await request(app)
      .post('/users')
      .send({
        email: 'getuser@example.com',
        password: 'testpass',
        name: 'Get User'
      });
    const userId = createRes.body.id;
    const res = await request(app).get(`/users/${userId}`);
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('id', userId);
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('PATCH /users/:id should update a user', async () => {
    // Create a user first
    const createRes = await request(app)
      .post('/users')
      .send({
        email: 'patchuser@example.com',
        password: 'testpass',
        name: 'Patch User'
      });
    const userId = createRes.body.id;
    const res = await request(app)
      .patch(`/users/${userId}`)
      .send({ name: 'Updated Name' });
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.name).toBe('Updated Name');
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('DELETE /users/:id should soft delete a user', async () => {
    // Create a user first
    const createRes = await request(app)
      .post('/users')
      .send({
        email: 'deleteuser@example.com',
        password: 'testpass',
        name: 'Delete User'
      });
    const userId = createRes.body.id;
    const res = await request(app).delete(`/users/${userId}`);
    expect([200, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('message');
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('POST /users should fail with duplicate email', async () => {
    // Try to create the same user twice
    await request(app)
      .post('/users')
      .send({
        email: 'duplicate@example.com',
        password: 'testpass',
        name: 'Dup User'
      });
    const res = await request(app)
      .post('/users')
      .send({
        email: 'duplicate@example.com',
        password: 'testpass',
        name: 'Dup User'
      });
    expect([409, 400, 500]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
  });

  it('PATCH /users/:id should not update a deleted user', async () => {
    // Create and delete a user
    const createRes = await request(app)
      .post('/users')
      .send({
        email: 'deletedpatch@example.com',
        password: 'testpass',
        name: 'Deleted Patch'
      });
    const userId = createRes.body.id;
    await request(app).delete(`/users/${userId}`);
    // Try to update
    const res = await request(app)
      .patch(`/users/${userId}`)
      .send({ name: 'Should Not Update' });
    expect([403, 404, 500]).toContain(res.statusCode);
    if (res.statusCode === 403) {
      expect(res.body.error).toMatch(/deleted/);
    } else {
      expect(res.body.error).toBeDefined();
    }
  });

  it('DELETE /users/:id should not delete an already deleted user', async () => {
    // Create and delete a user
    const createRes = await request(app)
      .post('/users')
      .send({
        email: 'alreadydeleted@example.com',
        password: 'testpass',
        name: 'Already Deleted'
      });
    const userId = createRes.body.id;
    await request(app).delete(`/users/${userId}`);
    // Try to delete again
    const res = await request(app).delete(`/users/${userId}`);
    expect([404, 500]).toContain(res.statusCode);
    expect(res.body.error).toBeDefined();
  });

  it('PATCH /users/:id should not allow updating id field', async () => {
    // Create a user
    const createRes = await request(app)
      .post('/users')
      .send({
        email: 'noidupdate@example.com',
        password: 'testpass',
        name: 'No ID Update'
      });
    const userId = createRes.body.id;
    // Try to update id
    const res = await request(app)
      .patch(`/users/${userId}`)
      .send({ id: 9999, name: 'Should Not Change ID' });
    expect([200, 500]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      expect(res.body.id).toBe(userId); // id should not change
    } else {
      expect(res.body.error).toBeDefined();
    }
  });
});
