import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper: create address, phone, category for recycle
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

describe('Recycle API', () => {
    let user, token, address, phone, category, recycleId;

    beforeEach(async () => {
        await clearDatabase();
        // Register & verify user
        await request(app)
            .post('/api/register')
            .send({ username: 'recycleuser', email: 'recycleuser@example.com', password: 'password123', confirmPassword: 'password123' });
        user = await prisma.user.findUnique({ where: { email: 'recycleuser@example.com' } });
        let otp = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app).post('/api/verify-email').send({ email: 'recycleuser@example.com', otp: otp.verification_code });
        token = jwt.sign({ id: user.id }, JWT_SECRET);
        // Setup address, phone, category
        ({ address, phone, category } = await setupUserData(user.id));
        // Setup minimal recycle location
        let recycleLocation = await prisma.recycleLocation.findFirst();
        if (!recycleLocation) {
            recycleLocation = await prisma.recycleLocation.create({
                data: {
                    location_name: 'Bank Sampah A',
                    address: 'Jl. Citarum No. 1',
                    latitude: -6.9,
                    longitude: 107.6,
                    phone: '081234567891',
                    description: 'Lokasi bank sampah test'
                }
            });
        }
        global.recycleLocationId = recycleLocation.id;
    }, 20000);

    afterAll(async () => { await prisma.$disconnect(); });

    describe('POST /api/recycles', () => {
        it('should create recycle with image', async () => {
            const testImagePath = path.join(__dirname, 'dummy-recycle.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const res = await request(app)
                .post('/api/recycles')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'Botol Plastik')
                .field('description', 'Botol plastik bekas')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .field('recycle_location_id', global.recycleLocationId)
                .attach('images', testImagePath);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('item_name', 'Botol Plastik');
            recycleId = res.body.data.id;
        });
    });

    describe('GET /api/recycle-locations', () => {
        it('should get recycle locations', async () => {
            const res = await request(app)
                .get('/api/recycle-locations')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/recycle-locations/:recycleLocationId', () => {
        it('should get recycle location detail (if any)', async () => {
            // Get list first
            const listRes = await request(app)
                .get('/api/recycle-locations')
                .set('Authorization', `Bearer ${token}`);
            if (listRes.body.data.length > 0) {
                const id = listRes.body.data[0].id;
                const res = await request(app)
                    .get(`/api/recycle-locations/${id}`)
                    .set('Authorization', `Bearer ${token}`);
                expect(res.statusCode).toBe(200);
                expect(res.body).toHaveProperty('success', true);
                expect(res.body.data).toHaveProperty('id', id);
            }
        });
    });

    describe('GET /api/users/current/recycles', () => {
        it('should get my recycle history', async () => {
            // Create recycle first
            const testImagePath = path.join(__dirname, 'dummy-recycle.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            await request(app)
                .post('/api/recycles')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'Botol Plastik')
                .field('description', 'Botol plastik bekas')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .attach('images', testImagePath);
            const res = await request(app)
                .get('/api/users/current/recycles')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /api/users/current/recycles/:recycleId', () => {
        it('should get my recycle detail', async () => {
            // Create recycle first
            const testImagePath = path.join(__dirname, 'dummy-recycle.jpg');
            if (!fs.existsSync(testImagePath)) fs.writeFileSync(testImagePath, Buffer.alloc(100, 1));
            const createRes = await request(app)
                .post('/api/recycles')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'Botol Plastik')
                .field('description', 'Botol plastik bekas')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .field('recycle_location_id', global.recycleLocationId)
                .attach('images', testImagePath);
            const id = createRes.body.data.id;
            const res = await request(app)
                .get(`/api/users/current/recycles/${id}`)
                .set('Authorization', `Bearer ${token}`);
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', id);
            expect(res.body.data).toHaveProperty('item_name', 'Botol Plastik');
        });
    });
});
