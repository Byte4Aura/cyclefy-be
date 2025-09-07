import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

describe('PATCH /api/users/current', () => {
    let user;
    let token;

    beforeEach(async () => {
        await clearDatabase();
        // Register and verify user
        await request(app)
            .post('/api/register')
            .send({
                username: 'updateuser',
                email: 'updateuser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
        user = await prisma.user.findUnique({ where: { email: 'updateuser@example.com' } });
        const otpRecord = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app)
            .post('/api/verify-email')
            .send({ email: 'updateuser@example.com', otp: otpRecord.verification_code });
        token = jwt.sign({ id: user.id }, JWT_SECRET);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should update fullname successfully', async () => {
        const res = await request(app)
            .patch('/api/users/current')
            .set('Authorization', `Bearer ${token}`)
            .send({ fullname: 'Updated Name' });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body.data).toHaveProperty('fullname', 'Updated Name');
    });

    it('should update password successfully', async () => {
        const res = await request(app)
            .patch('/api/users/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
                oldPassword: 'password123',
                password: 'newpassword123',
                confirmPassword: 'newpassword123'
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
    });

    it('should fail if oldPassword is wrong', async () => {
        const res = await request(app)
            .patch('/api/users/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
                oldPassword: 'wrongpassword',
                password: 'newpassword123',
                confirmPassword: 'newpassword123'
            });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });

    it('should fail if confirmPassword does not match', async () => {
        const res = await request(app)
            .patch('/api/users/current')
            .set('Authorization', `Bearer ${token}`)
            .send({
                oldPassword: 'password123',
                password: 'newpassword123',
                confirmPassword: 'wrongpassword'
            });
        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });
});
