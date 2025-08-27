import { PrismaClient } from '@prisma/client';
import { web } from '../src/application/web.js';
import supertest from 'supertest';

export const prisma = new PrismaClient();
export const request = supertest(web);

export const clearDatabase = async () => {
    // Hapus data di semua tabel yang akan di-test
    await prisma.donationStatusHistory.deleteMany();
    await prisma.donationImage.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.phone.deleteMany();
    await prisma.address.deleteMany();
    await prisma.emailVerification.deleteMany();
    await prisma.user.deleteMany();
    await prisma.category.deleteMany();
    // Tambahkan tabel lain jika perlu
};

beforeAll(async () => {
    // Setup sebelum semua test
    await clearDatabase();
});

afterAll(async () => {
    // Teardown setelah semua test
    await prisma.$disconnect();
});