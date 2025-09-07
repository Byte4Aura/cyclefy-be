import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';

describe('POST /api/verify-email', () => {
    let testUser;
    let otp;

    beforeEach(async () => {
        await clearDatabase();
        // Register user
        await request(app)
            .post('/api/register')
            .send({
                username: 'verifyuser',
                email: 'verifyuser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
        // Get user and OTP from DB
        testUser = await prisma.user.findUnique({ where: { email: 'verifyuser@example.com' } });
        const otpRecord = await prisma.emailVerification.findFirst({
            where: { user_id: testUser.id, is_used: false },
            orderBy: { created_at: 'desc' }
        });
        otp = otpRecord.verification_code;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should verify email successfully with correct OTP', async () => {
        const res = await request(app)
            .post('/api/verify-email')
            .send({
                email: 'verifyuser@example.com',
                otp
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('email', 'verifyuser@example.com');
        expect(res.body.data).toHaveProperty('verified', true);
    });

    it('should fail if OTP is wrong', async () => {
        const res = await request(app)
            .post('/api/verify-email')
            .send({
                email: 'verifyuser@example.com',
                otp: '9999'
            });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail if email not found', async () => {
        const res = await request(app)
            .post('/api/verify-email')
            .send({
                email: 'notfound@example.com',
                otp
            });
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });
});
