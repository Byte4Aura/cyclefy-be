import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper: create address, phone, category for borrow
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

describe('Borrow API', () => {
    let user, token, user2, token2, address, phone, category, borrowId;

    beforeEach(async () => {
        await clearDatabase();
        // Register & verify user 1
        await request(app)
            .post('/api/register')
            .send({ username: 'borrowuser', email: 'borrowuser@example.com', password: 'password123', confirmPassword: 'password123' });
        user = await prisma.user.findUnique({ where: { email: 'borrowuser@example.com' } });
        let otp = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app).post('/api/verify-email').send({ email: 'borrowuser@example.com', otp: otp.verification_code });
        token = jwt.sign({ id: user.id }, JWT_SECRET);
        // Register & verify user 2
        await request(app)
            .post('/api/register')
            .send({ username: 'borrowuser2', email: 'borrowuser2@example.com', password: 'password123', confirmPassword: 'password123' });
        user2 = await prisma.user.findUnique({ where: { email: 'borrowuser2@example.com' } });
        otp = await prisma.emailVerification.findFirst({ where: { user_id: user2.id, is_used: false } });
        await request(app).post('/api/verify-email').send({ email: 'borrowuser2@example.com', otp: otp.verification_code });
        token2 = jwt.sign({ id: user2.id }, JWT_SECRET);
        // Setup address, phone, category for both users
        ({ address, phone, category } = await setupUserData(user.id));
        await setupUserData(user2.id);
    }, 25000);

    afterAll(async () => { await prisma.$disconnect(); });

    describe('POST /api/borrows', () => {
        it('should create borrow with image', async () => {
            const testImagePath = path.join(__dirname, 'dummy-borrow.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const today = new Date();
            const from = today.toISOString().slice(0, 10);
            const to = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const res = await request(app)
                .post('/api/borrows')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'Kamera')
                .field('description', 'Kamera DSLR')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .field('duration_from', from)
                .field('duration_to', to)
                .attach('images', testImagePath);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('item_name', 'Kamera');
            borrowId = res.body.data.id;
        });
    });

    describe('GET /api/borrows', () => {
        it('should get borrows (discover)', async () => {
            // Buat borrow dari user2
            const { address: addr2, phone: phone2, category: cat2 } = await setupUserData(user2.id);
            const testImagePath = path.join(__dirname, 'dummy-borrow.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const today = new Date();
            const from = today.toISOString().slice(0, 10);
            const to = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            await request(app)
                .post('/api/borrows')
                .set('Authorization', `Bearer ${token2}`)
                .field('item_name', 'Kamera')
                .field('description', 'Kamera DSLR')
                .field('category_id', cat2.id)
                .field('address_id', addr2.id)
                .field('phone_id', phone2.id)
                .field('duration_from', from)
                .field('duration_to', to)
                .attach('images', testImagePath);
            const res = await request(app)
                .get('/api/borrows')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/borrows/:borrowId', () => {
        it('should get borrow detail (discover, not owner)', async () => {
            // Create borrow with user2, GET with user1 (mirip barter)
            const { address: addr2, phone: phone2, category: cat2 } = await setupUserData(user2.id);
            const testImagePath = path.join(__dirname, 'dummy-borrow.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const today = new Date();
            const from = today.toISOString().slice(0, 10);
            const to = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const createRes = await request(app)
                .post('/api/borrows')
                .set('Authorization', `Bearer ${token2}`)
                .field('item_name', 'Kamera')
                .field('description', 'Kamera DSLR')
                .field('category_id', cat2.id)
                .field('address_id', addr2.id)
                .field('phone_id', phone2.id)
                .field('duration_from', from)
                .field('duration_to', to)
                .attach('images', testImagePath);
            const id = createRes.body.data.id;
            const res = await request(app)
                .get(`/api/borrows/${id}`)
                .set('Authorization', `Bearer ${token}`); // user1 (bukan owner)
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', id);
            expect(res.body.data).toHaveProperty('item_name', 'Kamera');
        });
    });
});
