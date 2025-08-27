import { getRandomDonationStatusSequence, getRandomUnsplashImageUrl } from "./helper/donationSeederHelper.js";

export default async function donationSeeder(prisma, users, categories, addresses, phones) {
    // Dummy data
    const dummyDonations = [
        {
            item_name: "Baju Layak Pakai",
            description: "Baju bekas, masih bagus, siap pakai.",
        },
        {
            item_name: "Buku Pelajaran",
            description: "Buku pelajaran SD-SMP, lengkap dan bersih.",
        },
        {
            item_name: "Handphone Bekas",
            description: "HP Android, masih nyala, minus casing.",
        },
        {
            item_name: "Meja Belajar",
            description: "Meja belajar kayu, kokoh, ada sedikit goresan.",
        },
        {
            item_name: "Kursi Lipat",
            description: "Kursi lipat, ringan, mudah dibawa.",
        }
    ];

    for (let i = 0; i < dummyDonations.length; i++) {
        // Random user, category, address, phone
        const user = users[i % users.length];
        const category = categories[i % categories.length];
        const address = addresses[i % addresses.length];
        const phone = phones[i % phones.length];

        // Create donation
        const donation = await prisma.donation.create({
            data: {
                user_id: user.id,
                item_name: dummyDonations[i].item_name,
                description: dummyDonations[i].description,
                category_id: category.id,
                address_id: address.id,
                phone_id: phone.id,
            }
        });

        // Create images (1-3 per donation)
        const imageCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < imageCount; j++) {
            await prisma.donationImage.create({
                data: {
                    donation_id: donation.id,
                    // image_path: await getRandomUnsplashImageUrl(),
                    image_path: "https://dummyimage.com/600x400/000000/ffffff.png&text=dummy-image",
                    image_name: `unsplash_${j + 1}.jpg`,
                    image_size: 0 // Unknown for dummy url data using unsplash
                }
            });
        }

        // Create donation statur histories
        const statusSequence = getRandomDonationStatusSequence();
        for (const statusObj of statusSequence) {
            await prisma.donationStatusHistory.create({
                data: {
                    donation_id: donation.id,
                    status: statusObj.status,
                    status_detail: statusObj.status_detail,
                    // updated_by: user.id (opsional, jika ingin menambah user yang update)
                }
            });
        }
    }
}