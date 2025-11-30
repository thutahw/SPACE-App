import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

describe('SPACE-App API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;
  let spaceId: string;
  let bookingId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Apply same config as main.ts
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      })
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();

    // Clean up database
    await prisma.booking.deleteMany();
    await prisma.space.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up
    await prisma.booking.deleteMany();
    await prisma.space.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('Auth Module', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: 'user@test.com',
            password: 'Password123',
            name: 'Test User',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe('user@test.com');
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();

        userToken = response.body.data.accessToken;
        userId = response.body.data.user.id;
      });

      it('should register an admin user', async () => {
        // First register as normal user
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: 'admin@test.com',
            password: 'Password123',
            name: 'Admin User',
          })
          .expect(201);

        adminId = response.body.data.user.id;

        // Manually update to admin (in real app, this would be done differently)
        await prisma.user.update({
          where: { id: adminId },
          data: { role: 'ADMIN' },
        });

        // Login to get admin token
        const loginResponse = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'admin@test.com',
            password: 'Password123',
          })
          .expect(200);

        adminToken = loginResponse.body.data.accessToken;
      });

      it('should fail with duplicate email', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: 'user@test.com',
            password: 'Password123',
          })
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('USER_2002');
      });

      it('should fail with invalid email', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: 'invalid-email',
            password: 'Password123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should fail with weak password', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/register')
          .send({
            email: 'weak@test.com',
            password: 'weak',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'user@test.com',
            password: 'Password123',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.accessToken).toBeDefined();
        userToken = response.body.data.accessToken;
      });

      it('should fail with wrong password', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'user@test.com',
            password: 'wrongpassword',
          })
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AUTH_1001');
      });

      it('should fail with non-existent email', async () => {
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .send({
            email: 'nonexistent@test.com',
            password: 'Password123',
          })
          .expect(401);
      });
    });
  });

  describe('Spaces Module', () => {
    describe('POST /api/spaces', () => {
      it('should create a space', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/spaces')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Test Space',
            description: 'A test advertising space',
            price: 100.5,
            location: 'San Francisco, CA',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe('Test Space');
        expect(response.body.data.ownerId).toBe(userId);
        spaceId = response.body.data.id;
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .post('/api/spaces')
          .send({
            title: 'Test Space',
            price: 100,
          })
          .expect(401);
      });

      it('should fail with invalid data', async () => {
        await request(app.getHttpServer())
          .post('/api/spaces')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: '', // Empty title
            price: -10, // Negative price
          })
          .expect(400);
      });
    });

    describe('GET /api/spaces', () => {
      it('should list spaces (public)', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/spaces')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.data).toBeInstanceOf(Array);
        expect(response.body.data.meta).toBeDefined();
      });

      it('should filter by location', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/spaces?location=San Francisco')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.data.length).toBeGreaterThan(0);
      });

      it('should paginate results', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/spaces?page=1&limit=10')
          .expect(200);

        expect(response.body.data.meta.page).toBe(1);
        expect(response.body.data.meta.limit).toBe(10);
      });
    });

    describe('GET /api/spaces/:id', () => {
      it('should get a single space', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/spaces/${spaceId}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(spaceId);
      });

      it('should return 404 for non-existent space', async () => {
        await request(app.getHttpServer())
          .get('/api/spaces/nonexistent-id')
          .expect(404);
      });
    });

    describe('PATCH /api/spaces/:id', () => {
      it('should update own space', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/api/spaces/${spaceId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: 'Updated Space',
            price: 150,
          })
          .expect(200);

        expect(response.body.data.title).toBe('Updated Space');
        expect(parseFloat(response.body.data.price)).toBe(150);
      });

      it('should fail to update others space', async () => {
        await request(app.getHttpServer())
          .patch(`/api/spaces/${spaceId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            title: 'Hacked Space',
          })
          .expect(200); // Admin should be able to update
      });
    });
  });

  describe('Bookings Module', () => {
    let otherUserId: string;
    let otherUserToken: string;

    beforeAll(async () => {
      // Create another user to make bookings
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'booker@test.com',
          password: 'Password123',
          name: 'Booker User',
        });

      otherUserId = response.body.data.user.id;
      otherUserToken = response.body.data.accessToken;
    });

    describe('POST /api/bookings', () => {
      it('should create a booking', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 5);

        const response = await request(app.getHttpServer())
          .post('/api/bookings')
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({
            spaceId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            message: 'I would like to book this space',
          })
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.status).toBe('PENDING');
        expect(response.body.data.userId).toBe(otherUserId);
        bookingId = response.body.data.id;
      });

      it('should fail to book own space', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 10);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 15);

        const response = await request(app.getHttpServer())
          .post('/api/bookings')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            spaceId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
          .expect(403);

        expect(response.body.error.code).toBe('BOOKING_4002');
      });

      it('should fail with invalid dates', async () => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 5);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 1); // End before start

        await request(app.getHttpServer())
          .post('/api/bookings')
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({
            spaceId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
          .expect(400);
      });
    });

    describe('GET /api/bookings', () => {
      it('should list user bookings', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/bookings')
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.data.length).toBeGreaterThan(0);
      });

      it('should get booking by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/bookings/${bookingId}`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(200);

        expect(response.body.data.id).toBe(bookingId);
      });
    });

    describe('PATCH /api/bookings/:id/status', () => {
      it('should allow space owner to confirm booking', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/api/bookings/${bookingId}/status`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            status: 'CONFIRMED',
          })
          .expect(200);

        expect(response.body.data.status).toBe('CONFIRMED');
      });

      it('should not allow booking user to confirm', async () => {
        // Create a new pending booking first
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 20);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 25);

        const bookingResponse = await request(app.getHttpServer())
          .post('/api/bookings')
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({
            spaceId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });

        const newBookingId = bookingResponse.body.data.id;

        await request(app.getHttpServer())
          .patch(`/api/bookings/${newBookingId}/status`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({
            status: 'CONFIRMED',
          })
          .expect(403);
      });
    });

    describe('PATCH /api/bookings/:id/cancel', () => {
      it('should allow booking user to cancel', async () => {
        // Create a new booking to cancel
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 30);
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 35);

        const bookingResponse = await request(app.getHttpServer())
          .post('/api/bookings')
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({
            spaceId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          });

        const cancelBookingId = bookingResponse.body.data.id;

        const response = await request(app.getHttpServer())
          .patch(`/api/bookings/${cancelBookingId}/cancel`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .expect(200);

        expect(response.body.data.status).toBe('CANCELLED');
      });
    });
  });

  describe('Users Module', () => {
    describe('GET /api/users', () => {
      it('should allow admin to list users', async () => {
        const response = await request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });

      it('should deny non-admin users', async () => {
        await request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });

    describe('GET /api/users/:id', () => {
      it('should get user by id', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.data.id).toBe(userId);
      });
    });
  });
});
