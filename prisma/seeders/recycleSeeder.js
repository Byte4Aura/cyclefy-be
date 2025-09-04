import { faker } from '@faker-js/faker';

/**
 * Seeder untuk data recycle, status history, dan recycleImages
 * @param {PrismaClient} prisma
 * @param {Array} users - array user dari DB
 * @param {Array} categories - array category dari DB
 * @param {Array} addresses - array address dari DB
 * @param {Array} phones - array phone dari DB
 */
export async function recycleSeeder(prisma, users, categories, addresses, phones) {
    const recycleCount = 20;
    const statusSteps = [
        ["submitted"],
        ["submitted", "confirmed"],
        ["submitted", "confirmed", "completed"],
        ["submitted", "confirmed", "failed"],
        ["submitted", "failed"],
    ];

    for (let i = 0; i < recycleCount; i++) {
        // Random user, category, address, phone
        const user = users[i % users.length];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const address = addresses[Math.floor(Math.random() * addresses.length)];
        const phone = phones[Math.floor(Math.random() * phones.length)];

        // Create recycle
        const recycle = await prisma.recycle.create({
            data: {
                user_id: user.id,
                item_name: faker.commerce.productName(),
                description: faker.lorem.sentence(),
                address_id: address.id,
                category_id: category.id,
                phone_id: phone.id,
                recycle_location_id: Math.floor(Math.random() * 5) + 1 // asumsi sudah ada 5 recycle_location
            }
        });

        // Random status path
        const statusPath = statusSteps[Math.floor(Math.random() * statusSteps.length)];

        // Create status histories (berurutan)
        for (let j = 0; j < statusPath.length; j++) {
            await prisma.recycleStatusHistory.create({
                data: {
                    recycle_id: recycle.id,
                    status: statusPath[j],
                    status_detail: statusPath[j] === "submitted"
                        ? "recycle.post.submitted_detail"
                        : statusPath[j] === "confirmed"
                            ? "recycle.post.confirmed_detail"
                            : statusPath[j] === "completed"
                                ? "recycle.post.completed_detail"
                                : "recycle.post.failed_detail",
                    updated_by: user.id
                }
            });
        }

        // Create recycle images (1-3 per recycle)
        const imageCount = Math.floor(Math.random() * 3) + 1;
        for (let k = 1; k <= imageCount; k++) {
            await prisma.recycleImage.create({
                data: {
                    recycle_id: recycle.id,
                    image_path: `https://dummyimage.com/600x400/000/fff&text=recycle-post-${k}`,
                    image_name: `recycle-post-${k}.jpg`,
                    image_size: 1024 * (Math.floor(Math.random() * 200) + 50) // 50-250 KB
                }
            });
        }
    }
}