import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper: create address, phone, category for barter
async function setupUserData(userId) {
    const address = await prisma.address.create({
        data: {
            user_id: userId,
            address_name: 'Rumah',
            address: 'Jl. Asia Afrika, Bandung',
            latitude: -6.921, longitude: 107.607,
            city: 'Bandung', state: 'Jawa Barat', country: 'Indonesia', country_code: 'ID', zipcode: '40111'
        }
    });
    const phone = await prisma.phone.create({
        data: { user_id: userId, number: '081234567890' }
    });
    let category = await prisma.category.findFirst();
    if (!category) {
        category = await prisma.category.create({ data: { name: 'Elektronik' } });
    }
    return { address, phone, category };
}

describe('Barter API', () => {
    let user, token, user2, token2, address, phone, category;

    beforeEach(async () => {
        await clearDatabase();
        // Register & verify user 1
        await request(app)
            .post('/api/register')
            .send({ username: 'barteruser', email: 'barteruser@example.com', password: 'password123', confirmPassword: 'password123' });
        user = await prisma.user.findUnique({ where: { email: 'barteruser@example.com' } });
        let otp = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app).post('/api/verify-email').send({ email: 'barteruser@example.com', otp: otp.verification_code });
        token = jwt.sign({ id: user.id }, JWT_SECRET);
        // Register & verify user 2
        await request(app)
            .post('/api/register')
            .send({ username: 'barteruser2', email: 'barteruser2@example.com', password: 'password123', confirmPassword: 'password123' });
        user2 = await prisma.user.findUnique({ where: { email: 'barteruser2@example.com' } });
        otp = await prisma.emailVerification.findFirst({ where: { user_id: user2.id, is_used: false } });
        await request(app).post('/api/verify-email').send({ email: 'barteruser2@example.com', otp: otp.verification_code });
        token2 = jwt.sign({ id: user2.id }, JWT_SECRET);
        // Setup address, phone, category for both users
        ({ address, phone, category } = await setupUserData(user.id));
        await setupUserData(user2.id);
    }, 25000);

    afterAll(async () => { await prisma.$disconnect(); });

    describe('POST /api/barters', () => {
        it('should create barter with image', async () => {
            const testImagePath = path.join(__dirname, 'dummy-barter.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const res = await request(app)
                .post('/api/barters')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'Laptop')
                .field('description', 'Laptop bekas')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .attach('images', testImagePath);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('item_name', 'Laptop');
        });
    });

    describe('GET /api/barters', () => {
        it('should get barters (discover)', async () => {
            // Buat barter dari user2
            const { address: addr2, phone: phone2, category: cat2 } = await setupUserData(user2.id);
            const testImagePath = path.join(__dirname, 'dummy-barter2.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            await request(app)
                .post('/api/barters')
                .set('Authorization', `Bearer ${token2}`)
                .field('item_name', 'Handphone')
                .field('description', 'HP second')
                .field('category_id', cat2.id)
                .field('address_id', addr2.id)
                .field('phone_id', phone2.id)
                .attach('images', testImagePath);
            // User1 discover
            const res = await request(app)
                .get('/api/barters')
                .set('Authorization', `Bearer ${token}`);
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
        });
    });

    describe('GET /api/barters/:barterId', () => {
        it('should get barter detail', async () => {
            // Buat barter dari user2
            const { address: addr2, phone: phone2, category: cat2 } = await setupUserData(user2.id);
            const testImagePath = path.join(__dirname, 'dummy-barter3.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const createRes = await request(app)
                .post('/api/barters')
                .set('Authorization', `Bearer ${token2}`)
                .field('item_name', 'Sepeda')
                .field('description', 'Sepeda bekas')
                .field('category_id', cat2.id)
                .field('address_id', addr2.id)
                .field('phone_id', phone2.id)
                .attach('images', testImagePath);
            const barterId = createRes.body.data.id;
            const res = await request(app)
                .get(`/api/barters/${barterId}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', barterId);
        });
    });

    describe('POST /api/barters/:barterId/request', () => {
        it('should create barter application', async () => {
            // Buat barter dari user2
            const { address: addr2, phone: phone2, category: cat2 } = await setupUserData(user2.id);
            const testImagePath = path.join(__dirname, 'dummy-barter4.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const createRes = await request(app)
                .post('/api/barters')
                .set('Authorization', `Bearer ${token2}`)
                .field('item_name', 'Kamera')
                .field('description', 'Kamera bekas')
                .field('category_id', cat2.id)
                .field('address_id', addr2.id)
                .field('phone_id', phone2.id)
                .attach('images', testImagePath);
            const barterId = createRes.body.data.id;
            // User1 apply barter
            const appImagePath = path.join(__dirname, 'dummy-barter-app.jpg');
            if (!fs.existsSync(appImagePath)) fs.writeFileSync(appImagePath, Buffer.alloc(100, 1));
            const res = await request(app)
                .post(`/api/barters/${barterId}/request`)
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'Buku')
                .field('description', 'Buku bekas')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .attach('images', appImagePath);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('item_name', 'Buku');
        });
    });

    describe('GET /users/current/barters', () => {
        it('should get barter history', async () => {
            const res = await request(app)
                .get('/api/users/current/barters')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('data');
        });
    });

    // Endpoint detail, mark as completed, incoming request, dsb
    // Untuk test sederhana, cukup pastikan endpoint bisa diakses dan response success
    // Untuk endpoint yang butuh id, gunakan id dari create sebelumnya
});
