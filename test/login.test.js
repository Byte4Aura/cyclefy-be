import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';

describe('POST /api/users/login', () => {
    beforeEach(async () => {
        await clearDatabase();
        // Register and verify user
        await request(app)
            .post('/api/register')
            .send({
                username: 'loginuser',
                email: 'loginuser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
        const user = await prisma.user.findUnique({ where: { email: 'loginuser@example.com' } });
        const otpRecord = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app)
            .post('/api/verify-email')
            .send({ email: 'loginuser@example.com', otp: otpRecord.verification_code });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should login successfully with correct credentials (email)', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                identifier: 'loginuser@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('email', 'loginuser@example.com');
        expect(res.body).toHaveProperty('token');
    });

    it('should login successfully with correct credentials (username)', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                identifier: 'loginuser',
                password: 'password123'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('username', 'loginuser');
        expect(res.body).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                identifier: 'loginuser@example.com',
                password: 'wrongpassword'
            });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail with unregistered email', async () => {
        const res = await request(app)
            .post('/api/users/login')
            .send({
                identifier: 'notfound@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail if email not verified', async () => {
        // Register user baru tanpa verifikasi
        await request(app)
            .post('/api/register')
            .send({
                username: 'unverified',
                email: 'unverified@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
        const res = await request(app)
            .post('/api/users/login')
            .send({
                identifier: 'unverified@example.com',
                password: 'password123'
            });
        expect(res.statusCode).toBe(403);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });
});
