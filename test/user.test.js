import { request, prisma, clearDatabase } from './testUtils.js';
import bcrypt from 'bcrypt';

describe('/api/register', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('should register a new user', async () => {
        const res = await request.post('/api/register').send({
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
            confirmPassword: 'password123'
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
    });

    it('should not register with duplicate email', async () => {
        await prisma.user.create({
            data: {
                username: 'testuser',
                email: 'testuser@example.com',
                password: 'hashedpassword'
            }
        });
        const res = await request.post('/api/register').send({
            username: 'testuser2',
            email: 'testuser@example.com',
            password: 'password123',
            confirmPassword: 'password123'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should not register with invalid email', async () => {
        const res = await request.post('/api/register').send({
            username: 'testuser',
            email: 'notanemail',
            password: 'password123',
            confirmPassword: 'password123'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should not register if password and confirmPassword mismatch', async () => {
        const res = await request.post('/api/register').send({
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'password123',
            confirmPassword: 'password456'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});

describe('/api/verify-email', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('should fail if OTP or email is missing', async () => {
        const res = await request.post('/api/verify-email').send({
            email: 'testuser@example.com'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should fail if OTP is wrong', async () => {
        // Simulasi user sudah register dan ada OTP (mock jika perlu)
        const res = await request.post('/api/verify-email').send({
            email: 'testuser@example.com',
            otp: '0000'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // Test sukses bisa ditambah jika implementasi OTP sudah bisa di-mock
});

describe('/api/resend-email-verification-otp', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('should fail if email is missing', async () => {
        const res = await request.post('/api/resend-email-verification-otp').send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should fail if email is not registered', async () => {
        const res = await request.post('/api/resend-email-verification-otp').send({
            email: 'notfound@example.com'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // Test sukses bisa ditambah jika implementasi sudah bisa di-mock
});

describe('/api/send-reset-password-otp', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('should fail if email is missing', async () => {
        const res = await request.post('/api/send-reset-password-otp').send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should fail if email is not registered', async () => {
        const res = await request.post('/api/send-reset-password-otp').send({
            email: 'notfound@example.com'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // Test sukses bisa ditambah jika implementasi sudah bisa di-mock
});

describe('/api/reset-password', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    it('should fail if required fields are missing', async () => {
        const res = await request.post('/api/reset-password').send({});
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should fail if OTP is wrong', async () => {
        const res = await request.post('/api/reset-password').send({
            email: 'testuser@example.com',
            otp: '0000',
            password: 'newpassword',
            confirmPassword: 'newpassword'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should fail if password and confirmPassword mismatch', async () => {
        const res = await request.post('/api/reset-password').send({
            email: 'testuser@example.com',
            otp: '0000',
            password: 'newpassword',
            confirmPassword: 'wrongpassword'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    // Test sukses bisa ditambah jika implementasi sudah bisa di-mock
});

describe('/api/users/login', () => {
    beforeEach(async () => {
        await clearDatabase();
        const password = await bcrypt.hash('password123', 10);
        await prisma.user.create({
            data: {
                username: 'testuser',
                email: 'testuser@example.com',
                password: password,
                is_email_verified: true
            }
        });
    });

    it('should login with correct username and password', async () => {
        const res = await request.post('/api/users/login').send({
            identifier: 'testuser',
            password: 'password123'
        });
        expect([200, 201]).toContain(res.status);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('token');
    });

    it('should login with correct email and password', async () => {
        const res = await request.post('/api/users/login').send({
            identifier: 'testuser@example.com',
            password: 'password123'
        });
        expect([200, 201]).toContain(res.status);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('token');
    });

    it('should fail with wrong password', async () => {
        const res = await request.post('/api/users/login').send({
            identifier: 'testuser',
            password: 'wrongpassword'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should fail with unregistered user', async () => {
        const res = await request.post('/api/users/login').send({
            identifier: 'notfound',
            password: 'password123'
        });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
});