import { PrismaClient } from '@prisma/client';
import bankSeeder from './seeders/bankSeeder.js';
import categoriesSeeder from './seeders/categorySeeder.js';
import userSeeder from './seeders/userSeeder.js';
import addressSeeder from './seeders/addressSeeder.js';
import phoneSeeder from './seeders/phoneSeeder.js';
import donationSeeder from './seeders/donationSeeder.js';
const prisma = new PrismaClient();

async function main() {
    await bankSeeder(prisma);
    await categoriesSeeder(prisma);
    const users = await userSeeder(prisma);
    await phoneSeeder(prisma, users);
    await addressSeeder(prisma, users);

    // Ambil data relasi yang sudah di-seed
    const categories = await prisma.category.findMany();
    const addresses = await prisma.address.findMany();
    const phones = await prisma.phone.findMany();

    await donationSeeder(prisma, users, categories, addresses, phones);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });