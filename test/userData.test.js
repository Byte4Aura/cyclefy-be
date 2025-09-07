import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

describe('User Data API', () => {
    let user;
    let token;

    beforeEach(async () => {
        await clearDatabase();
        // Register and verify user
        await request(app)
            .post('/api/register')
            .send({
                username: 'datauser',
                email: 'datauser@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });
        user = await prisma.user.findUnique({ where: { email: 'datauser@example.com' } });
        const otpRecord = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app)
            .post('/api/verify-email')
            .send({ email: 'datauser@example.com', otp: otpRecord.verification_code });
        token = jwt.sign({ id: user.id }, JWT_SECRET);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Categories API', () => {
        it('should get categories (success)', async () => {
            const res = await request(app)
                .get('/api/categories')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('Address API', () => {
        let addressId;
        it('should create address', async () => {
            const res = await request(app)
                .post('/api/users/current/addresses')
                .set('Authorization', `Bearer ${token}`)
                .send({ addressName: 'Rumah', address: 'Jl. Asia Afrika, Bandung' });
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('address_name', 'Rumah');
            addressId = res.body.data.id;
        });
        it('should get addresses', async () => {
            await request(app)
                .post('/api/users/current/addresses')
                .set('Authorization', `Bearer ${token}`)
                .send({ addressName: 'Kantor', address: 'Jl. Braga, Bandung' });
            const res = await request(app)
                .get('/api/users/current/addresses')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
        it('should get address by id', async () => {
            const createRes = await request(app)
                .post('/api/users/current/addresses')
                .set('Authorization', `Bearer ${token}`)
                .send({ addressName: 'Kost', address: 'Jl. Dipatiukur, Bandung' });
            const id = createRes.body.data.id;
            const res = await request(app)
                .get(`/api/users/current/addresses/${id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', id);
        });
        it('should update address', async () => {
            const createRes = await request(app)
                .post('/api/users/current/addresses')
                .set('Authorization', `Bearer ${token}`)
                .send({ addressName: 'Update', address: 'Jl. Cihampelas, Bandung' });
            const id = createRes.body.data.id;
            const res = await request(app)
                .patch(`/api/users/current/addresses/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ addressName: 'Updated', address: 'Jl. Cihampelas No. 10, Bandung' });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('address_name', 'Updated');
        });
        it('should delete address', async () => {
            const createRes = await request(app)
                .post('/api/users/current/addresses')
                .set('Authorization', `Bearer ${token}`)
                .send({ addressName: 'Delete', address: 'Jl. Pasteur, Bandung' });
            const id = createRes.body.data.id;
            const res = await request(app)
                .delete(`/api/users/current/addresses/${id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });

    describe('Phone API', () => {
        let phoneId;
        it('should create phone', async () => {
            const res = await request(app)
                .post('/api/users/current/phones')
                .set('Authorization', `Bearer ${token}`)
                .send({ number: '081234567890' });
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('number', '081234567890');
            phoneId = res.body.data.id;
        });
        it('should get phones', async () => {
            await request(app)
                .post('/api/users/current/phones')
                .set('Authorization', `Bearer ${token}`)
                .send({ number: '081234567891' });
            const res = await request(app)
                .get('/api/users/current/phones')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
        it('should get phone by id', async () => {
            const createRes = await request(app)
                .post('/api/users/current/phones')
                .set('Authorization', `Bearer ${token}`)
                .send({ number: '081234567892' });
            const id = createRes.body.data.id;
            const res = await request(app)
                .get(`/api/users/current/phones/${id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', id);
        });
        it('should update phone', async () => {
            const createRes = await request(app)
                .post('/api/users/current/phones')
                .set('Authorization', `Bearer ${token}`)
                .send({ number: '081234567893' });
            const id = createRes.body.data.id;
            const res = await request(app)
                .patch(`/api/users/current/phones/${id}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ number: '081234567894' });
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('number', '081234567894');
        });
        it('should delete phone', async () => {
            const createRes = await request(app)
                .post('/api/users/current/phones')
                .set('Authorization', `Bearer ${token}`)
                .send({ number: '081234567895' });
            const id = createRes.body.data.id;
            const res = await request(app)
                .delete(`/api/users/current/phones/${id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
        });
    });
});
