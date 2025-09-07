import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';

describe('POST /api/reset-password', () => {
    let testUser;
    let otp;

    beforeEach(async () => {
        await clearDatabase();
        // Register user
        await request(app)
            .post('/api/register')
            .send({
                username: 'resetpwuser',
                email: 'resetpwuser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
        testUser = await prisma.user.findUnique({ where: { email: 'resetpwuser@example.com' } });
        // Send reset password OTP
        await request(app)
            .post('/api/send-reset-password-otp')
            .send({ email: 'resetpwuser@example.com' });
        // Get OTP from DB
        const otpRecord = await prisma.passwordReset.findFirst({ where: { user_id: testUser.id, is_used: false }, orderBy: { created_at: 'desc' } });
        otp = otpRecord.otp;
    }, 20000);

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should reset password successfully with valid OTP', async () => {
        const res = await request(app)
            .post('/api/reset-password')
            .send({
                email: 'resetpwuser@example.com',
                otp,
                newPassword: 'newpassword123',
                confirmNewPassword: 'newpassword123'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('message');
    }, 20000);

    it('should fail if OTP is wrong', async () => {
        const res = await request(app)
            .post('/api/reset-password')
            .send({
                email: 'resetpwuser@example.com',
                otp: '9999',
                newPassword: 'newpassword123',
                confirmNewPassword: 'newpassword123'
            });
        expect(res.statusCode).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    }, 20000);

    it('should fail if confirmNewPassword does not match', async () => {
        const res = await request(app)
            .post('/api/reset-password')
            .send({
                email: 'resetpwuser@example.com',
                otp,
                newPassword: 'newpassword123',
                confirmNewPassword: 'wrongpassword'
            });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    }, 20000);
});
