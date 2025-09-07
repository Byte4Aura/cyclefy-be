import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';

describe('POST /api/send-reset-password-otp', () => {
    beforeEach(async () => {
        await clearDatabase();
        // Register user
        await request(app)
            .post('/api/register')
            .send({
                username: 'resetuser',
                email: 'resetuser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should send reset password OTP if email exists', async () => {
        const res = await request(app)
            .post('/api/send-reset-password-otp')
            .send({ email: 'resetuser@example.com' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail if email not found', async () => {
        const res = await request(app)
            .post('/api/send-reset-password-otp')
            .send({ email: 'notfound@example.com' });
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });
});
