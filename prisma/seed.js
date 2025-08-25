import { PrismaClient } from '@prisma/client';
import bankSeeder from './seeders/bankSeeder.js';
import categoriesSeeder from './seeders/categorySeeder.js';
import userSeeder from './seeders/userSeeder.js';
import addressSeeder from './seeders/addressSeeder.js';
import phoneSeeder from './seeders/phoneSeeder.js';
const prisma = new PrismaClient();

async function main() {
    await bankSeeder(prisma);
    await categoriesSeeder(prisma);
    const users = await userSeeder(prisma);
    await phoneSeeder(prisma, users);
    await addressSeeder(prisma, users);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });