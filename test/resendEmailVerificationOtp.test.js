import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';

describe('POST /api/resend-email-verification-otp', () => {
    beforeEach(async () => {
        await clearDatabase();
        // Register user (email belum diverifikasi)
        await request(app)
            .post('/api/register')
            .send({
                username: 'resenduser',
                email: 'resenduser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should resend OTP if email is not verified', async () => {
        const res = await request(app)
            .post('/api/resend-email-verification-otp')
            .send({ email: 'resenduser@example.com' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('email', 'resenduser@example.com');
    }, 20000);

    it('should fail if email not found', async () => {
        const res = await request(app)
            .post('/api/resend-email-verification-otp')
            .send({ email: 'notfound@example.com' });
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail if email already verified', async () => {
        // Verifikasi email dulu
        const user = await prisma.user.findUnique({ where: { email: 'resenduser@example.com' } });
        const otpRecord = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app)
            .post('/api/verify-email')
            .send({ email: 'resenduser@example.com', otp: otpRecord.verification_code });
        // Coba resend
        const res = await request(app)
            .post('/api/resend-email-verification-otp')
            .send({ email: 'resenduser@example.com' });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });
});
