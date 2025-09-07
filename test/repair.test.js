import request from 'supertest';
import { web as app } from '../src/application/web.js';
import { clearDatabase, prisma } from './testUtils.js';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Helper: create address, phone, category for repair
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
    // Setup repair price for this category
    let repairPrice = await prisma.repairPrice.findUnique({ where: { category_id: category.id } });
    if (!repairPrice) {
        repairPrice = await prisma.repairPrice.create({
            data: {
                category_id: category.id,
                minor_repair: 10000,
                moderate_repair: 20000,
                major_repair: 30000
            }
        });
    }
    return { address, phone, category, repairPrice };
}

describe('Repair API', () => {
    let user, token, address, phone, category, repairPrice, repairId;

    beforeEach(async () => {
        await clearDatabase();
        // Register & verify user
        await request(app)
            .post('/api/register')
            .send({ username: 'repairuser', email: 'repairuser@example.com', password: 'password123', confirmPassword: 'password123' });
        user = await prisma.user.findUnique({ where: { email: 'repairuser@example.com' } });
        let otp = await prisma.emailVerification.findFirst({ where: { user_id: user.id, is_used: false } });
        await request(app).post('/api/verify-email').send({ email: 'repairuser@example.com', otp: otp.verification_code });
        token = jwt.sign({ id: user.id }, JWT_SECRET);
        // Setup address, phone, category, repairPrice
        ({ address, phone, category, repairPrice } = await setupUserData(user.id));
    }, 20000);

    afterAll(async () => { await prisma.$disconnect(); });

    describe('GET /categories/:categoryId/repair-prices', () => {
        it('should get repair price for category', async () => {
            const res = await request(app)
                .get(`/api/categories/${category.id}/repair-prices`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('minor_price', 18358);
        });
    });

    describe('POST /api/repairs', () => {
        it('should create repair with images', async () => {
            const testImagePath1 = path.join(__dirname, 'dummy-repair-front.jpg');
            const testImagePath2 = path.join(__dirname, 'dummy-repair-damage.jpg');
            if (!fs.existsSync(testImagePath1)) fs.writeFileSync(testImagePath1, Buffer.alloc(100, 1));
            if (!fs.existsSync(testImagePath2)) fs.writeFileSync(testImagePath2, Buffer.alloc(100, 2));
            const res = await request(app)
                .post('/api/repairs')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'TV Rusak')
                .field('description', 'TV rusak total')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .field('item_weight', 2)
                .field('repair_type', 'minor_repair')
                .field('repair_location', 'my_location')
                .attach('front_view', testImagePath1)
                .attach('close_up_damage', testImagePath2);
            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('item_name', 'TV Rusak');
            repairId = res.body.data.id;
        });
    });

    describe('GET /repairs/:repairId', () => {
        it('should get repair detail', async () => {
            // Create repair first
            const testImagePath1 = path.join(__dirname, 'dummy-repair-front.jpg');
            const testImagePath2 = path.join(__dirname, 'dummy-repair-damage.jpg');
            if (!fs.existsSync(testImagePath1)) fs.writeFileSync(testImagePath1, Buffer.alloc(100, 1));
            if (!fs.existsSync(testImagePath2)) fs.writeFileSync(testImagePath2, Buffer.alloc(100, 2));
            const createRes = await request(app)
                .post('/api/repairs')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'TV Rusak')
                .field('description', 'TV rusak total')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .field('item_weight', 2)
                .field('repair_type', 'minor_repair')
                .field('repair_location', 'my_location')
                .attach('front_view', testImagePath1)
                .attach('close_up_damage', testImagePath2);
            const id = createRes.body.data.id;
            const res = await request(app)
                .get(`/api/repairs/${id}`)
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', id);
            expect(res.body.data).toHaveProperty('item_name', 'TV Rusak');
        });
    });

    describe('POST /repairs/:repairId/pay', () => {
        it('should request repair payment', async () => {
            // Create repair first
            const testImagePath1 = path.join(__dirname, 'dummy-repair-front.jpg');
            const testImagePath2 = path.join(__dirname, 'dummy-repair-damage.jpg');
            if (!fs.existsSync(testImagePath1)) fs.writeFileSync(testImagePath1, Buffer.alloc(100, 1));
            if (!fs.existsSync(testImagePath2)) fs.writeFileSync(testImagePath2, Buffer.alloc(100, 2));
            const createRes = await request(app)
                .post('/api/repairs')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'TV Rusak')
                .field('description', 'TV rusak total')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .field('item_weight', 2)
                .field('repair_type', 'minor_repair')
                .field('repair_location', 'my_location')
                .attach('front_view', testImagePath1)
                .attach('close_up_damage', testImagePath2);
            const id = createRes.body.data.id;
            const res = await request(app)
                .post(`/api/repairs/${id}/pay`)
                .set('Authorization', `Bearer ${token}`)
                .send({ paymentType: 'qris' });
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success', true);
        });
    });

    describe('GET /repairs/:repairId/payment-status', () => {
        it('should get repair payment status', async () => {
            // Create repair first
            const testImagePath1 = path.join(__dirname, 'dummy-repair-front.jpg');
            const testImagePath2 = path.join(__dirname, 'dummy-repair-damage.jpg');
            if (!fs.existsSync(testImagePath1)) fs.writeFileSync(testImagePath1, Buffer.alloc(100, 1));
            if (!fs.existsSync(testImagePath2)) fs.writeFileSync(testImagePath2, Buffer.alloc(100, 2));
            const createRes = await request(app)
                .post('/api/repairs')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'TV Rusak')
                .field('description', 'TV rusak total')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .field('item_weight', 2)
                .field('repair_type', 'minor_repair')
                .field('repair_location', 'my_location')
                .attach('front_view', testImagePath1)
                .attach('close_up_damage', testImagePath2);
            const id = createRes.body.data.id;
            const res = await request(app)
                .get(`/api/repairs/${id}/payment-status`)
                .set('Authorization', `Bearer ${token}`);
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success', true);
        });
    });

    describe('GET /users/current/repairs', () => {
        it('should get my repair history', async () => {
            // Create repair first
            const testImagePath1 = path.join(__dirname, 'dummy-repair-front.jpg');
            const testImagePath2 = path.join(__dirname, 'dummy-repair-damage.jpg');
            if (!fs.existsSync(testImagePath1)) fs.writeFileSync(testImagePath1, Buffer.alloc(100, 1));
            if (!fs.existsSync(testImagePath2)) fs.writeFileSync(testImagePath2, Buffer.alloc(100, 2));
            await request(app)
                .post('/api/repairs')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'TV Rusak')
                .field('description', 'TV rusak total')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .field('item_weight', 2)
                .field('repair_type', 'minor_repair')
                .field('repair_location', 'my_location')
                .attach('front_view', testImagePath1)
                .attach('close_up_damage', testImagePath2);
            const res = await request(app)
                .get('/api/users/current/repairs')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('GET /users/current/repairs/:repairId', () => {
        it('should get my repair detail', async () => {
            // Create repair first
            const testImagePath1 = path.join(__dirname, 'dummy-repair-front.jpg');
            const testImagePath2 = path.join(__dirname, 'dummy-repair-damage.jpg');
            if (!fs.existsSync(testImagePath1)) fs.writeFileSync(testImagePath1, Buffer.alloc(100, 1));
            if (!fs.existsSync(testImagePath2)) fs.writeFileSync(testImagePath2, Buffer.alloc(100, 2));
            const createRes = await request(app)
                .post('/api/repairs')
                .set('Authorization', `Bearer ${token}`)
                .field('item_name', 'TV Rusak')
                .field('description', 'TV rusak total')
                .field('category_id', category.id)
                .field('address_id', address.id)
                .field('phone_id', phone.id)
                .field('item_weight', 2)
                .field('repair_type', 'minor_repair')
                .field('repair_location', 'my_location')
                .attach('front_view', testImagePath1)
                .attach('close_up_damage', testImagePath2);
            const id = createRes.body.data.id;
            const res = await request(app)
                .get(`/api/users/current/repairs/${id}`)
                .set('Authorization', `Bearer ${token}`);
            expect([200, 201]).toContain(res.statusCode);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.data).toHaveProperty('id', id);
            expect(res.body.data).toHaveProperty('item_name', 'TV Rusak');
        });
    });
});
