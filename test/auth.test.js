// test/auth.test.js
import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';

describe('POST /api/register', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });

        console.log(res.error);
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('email', 'testuser@example.com');
    });

    it('should fail if email already registered', async () => {
        await prisma.user.create({
            data: {
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'password123',
            }
        });
        const res = await request(app)
            .post('/api/register')
            .send({
                username: 'testuser2',
                email: 'testuser@example.com',
                password: 'password123',
                confirm_password: 'password123'
            });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail if password and confirm_password do not match', async () => {
        const res = await request(app)
            .post('/api/register')
            .send({
                fullname: 'Test User',
                username: 'testuser3',
                email: 'testuser3@example.com',
                password: 'password123',
                confirm_password: 'wrongpassword'
            });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });
});
