export default async function categoriesSeeder(prisma) {
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