import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

describe('GET /api/users/current', () => {
    let user;
    let token;

    beforeEach(async () => {
        await clearDatabase();
        // Register and verify user
        await request(app)
            .post('/api/register')
            .send({
                username: 'currentuser',
                email: 'currentuser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
        user = await prisma.user.findUnique({ where: { email: 'currentuser@example.com' } });
        const otpRecord = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app)
            .post('/api/verify-email')
            .send({ email: 'currentuser@example.com', otp: otpRecord.verification_code });
        // Generate JWT token
        token = jwt.sign({ id: user.id }, JWT_SECRET);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should get current user info with valid token', async () => {
        const res = await request(app)
            .get('/api/users/current')
            .set('Authorization', `Bearer ${token}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('email', 'currentuser@example.com');
    });

    it('should fail if token is missing', async () => {
        const res = await request(app)
            .get('/api/users/current');
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
    });
});
