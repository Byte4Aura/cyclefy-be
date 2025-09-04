export default async function repairPriceSeeder(prisma) {
    // Ambil semua kategori
    const categories = await prisma.category.findMany();

    // Helper untuk random harga (misal range 20.000 - 150.000)
    function getRandomPrice(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    for (const category of categories) {
        const minor_repair = getRandomPrice(5000, 25000);
        const moderate_repair = getRandomPrice(7500, 35000);
        const major_repair = getRandomPrice(13000, 50000);

        await prisma.repairPrice.upsert({
            where: { category_id: category.id },
            update: {
                minor_repair,
                moderate_repair,
                major_repair,
            },
            create: {
                category_id: category.id,
                minor_repair,
                moderate_repair,
                major_repair,
            },
        });
    }
}