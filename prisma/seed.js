import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function bankSeeder() {
    const banks = [
        { code: 'bca', name: 'Bank Central Asia', logo_url: '/assets/bca.png' },
        { code: 'bni', name: 'Bank Negara Indonesia', logo_url: '/assets/bni.png' },
        { code: 'mandiri', name: 'Bank Mandiri', logo_url: '/assets/mandiri.png' },
        { code: 'bri', name: 'Bank Rakyat Indonesia', logo_url: '/assets/bri.png' },
        { code: 'permata', name: 'Bank Permata', logo_url: '/assets/permata.png' },
        { code: 'danamon', name: 'Bank Danamon', logo_url: '/assets/danamon.png' },
    ];

    for (const bank of banks) {
        // await prisma.bank.upsert({
        //     where: { code: bank.code },
        //     update: {},
        //     create: bank,
        // });
        await prisma.bank.upsert({
            where: {
                code: bank.code
            },
            update: {},
            create: bank
        });
    }
}

bankSeeder()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });


async function categoriesSeeder() {
    const categories = [
        { name: 'Clothes', description: 'Used or new clothes' },
        { name: 'Books', description: 'Books and educational materials' },
        { name: 'Electronics', description: 'Gadgets, phones, laptops' },
        { name: 'Furniture', description: 'Tables, chairs, etc.' },
        { name: 'Others', description: 'Other items' },
    ];

    for (const category of categories) {
        await prisma.category.upsert({
            where: { name: category.name },
            update: {},
            create: category,
        });
    }
}

categoriesSeeder()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });