import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

describe('PATCH /api/users/current/profile-picture', () => {
    let user;
    let token;

    beforeEach(async () => {
        await clearDatabase();
        // Register and verify user
        await request(app)
            .post('/api/register')
            .send({
                username: 'picuser',
                email: 'picuser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
        user = await prisma.user.findUnique({ where: { email: 'picuser@example.com' } });
        const otpRecord = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app)
            .post('/api/verify-email')
            .send({ email: 'picuser@example.com', otp: otpRecord.verification_code });
        token = jwt.sign({ id: user.id }, JWT_SECRET);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should update profile picture successfully', async () => {
        const testImagePath = path.join(__dirname, 'dummy-profile.jpg');
        // Buat file dummy jika belum ada
        if (!fs.existsSync(testImagePath)) {
            fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
        }
        const res = await request(app)
            .patch('/api/users/current/profile-picture')
            .set('Authorization', `Bearer ${token}`)
            .attach('profile_picture', testImagePath);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('profile_picture');
    });

    it('should fail if no file uploaded', async () => {
        const res = await request(app)
            .patch('/api/users/current/profile-picture')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });
});
