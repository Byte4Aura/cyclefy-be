
import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper: create address, phone, category for donation
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
        category = await prisma.category.create({ data: { name: 'Pakaian' } });
    }
    return { address, phone, category };
}

describe('Donation API', () => {
    let user, token, address, phone, category, donationId;

    beforeEach(async () => {
        await clearDatabase();
        // Register & verify user
        await request(app)
            .post('/api/register')
            .send({ username: 'donationuser', email: 'donationuser@example.com', password: 'password123', confirmPassword: 'password123' });
        user = await prisma.user.findUnique({ where: { email: 'donationuser@example.com' } });
        let otp = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app).post('/api/verify-email').send({ email: 'donationuser@example.com', otp: otp.verification_code });
        token = jwt.sign({ id: user.id }, JWT_SECRET);
        // Setup address, phone, category
        ({ address, phone, category } = await setupUserData(user.id));
    }, 20000);

    afterAll(async () => { await prisma.$disconnect(); });

    describe('POST /api/donations', () => {
        it('should create donation with image', async () => {
            const testImagePath = path.join(__dirname, 'dummy-donation.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const res = await request(app)
                .post('/api/donations')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'Baju Bekas')
                .field('description', 'Baju bekas layak pakai')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .attach('images', testImagePath);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('item_name', 'Baju Bekas');
            donationId = res.body.data.id;
        });
    });

    describe('GET /api/users/current/donations', () => {
        it('should get list of donations for current user', async () => {
            // Create a donation first
            const testImagePath = path.join(__dirname, 'dummy-donation.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            await request(app)
                .post('/api/donations')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'Baju Bekas')
                .field('description', 'Baju bekas layak pakai')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .attach('images', testImagePath);
            const res = await request(app)
                .get('/api/users/current/donations')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /api/users/current/donations/:donationId', () => {
        it('should get donation detail for current user', async () => {
            // Create a donation first
            const testImagePath = path.join(__dirname, 'dummy-donation.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const createRes = await request(app)
                .post('/api/donations')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'Baju Bekas')
                .field('description', 'Baju bekas layak pakai')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .attach('images', testImagePath);
            const id = createRes.body.data.id;
            const res = await request(app)
                .get(`/api/users/current/donations/${id}`)
                .set('Authorization', `Bearer ${token}`);
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', id);
            expect(res.body.data).toHaveProperty('item_name', 'Baju Bekas');
        });
    });
});
