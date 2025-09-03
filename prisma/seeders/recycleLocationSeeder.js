import { faker } from '@faker-js/faker';

// Dummy alamatData, ganti dengan import jika sudah ada file json
const alamatData = [
    {
        name: "Permata buah batu, lengkong",
        latitude: -6.9724402,
        longitude: 107.638862,
        formattedAddress: "Permata Buah Batu, Lengkong, Bojongsoang, Kabupaten Bandung, Jawa Barat, Jawa, Indonesia"
    },
    {
        name: "Jalan sukapura, dayeuhkolot, bandung",
        latitude: -6.9697397,
        longitude: 107.634133,
        formattedAddress: "Jalan Sukapura, Sukapura, Dayeuhkolot, Kabupaten Bandung, Jawa Barat, Jawa, 40257, Indonesia"
    },
    {
        name: "masjid al muhajirin, cipadung kulon, bandung",
        latitude: -6.9229148,
        longitude: 107.7026636,
        formattedAddress: "Masjid Al-Muhajirin, Jalan Pakuan VI, Cipadung Kulon, Panyileukan, Kota Bandung, Jawa Barat, Jawa, 40614, Indonesia"
    },
    {
        name: "jalan batumas 2, pasirluyu, regol",
        latitude: -6.9531779,
        longitude: 107.6156953,
        formattedAddress: "Jalan Batumas II, Pasirluyu, Regol, Kota Bandung, Jawa Barat, Jawa, 40255, Indonesia"
    },
    {
        name: "Gang babakan jati mulya IV, Gumuruh",
        latitude: -6.9406336,
        longitude: 107.6378511,
        formattedAddress: "Gang Babakan Jati Mulya IV, Gumuruh, Batununggal, Kota Bandung, Jawa Barat, Jawa, 40275, Indonesia"
    }
];

export default async function recycleLocationSeeder(prisma) {
    // 1. Generate locations
    const locations = [];
    const locationCount = 5;
    for (let i = 0; i < locationCount; i++) {
        const alamat = alamatData[Math.floor(Math.random() * alamatData.length)];
        locations.push({
            location_name: faker.company.name() + " Recycle Center",
            address: alamat.formattedAddress,
            latitude: alamat.latitude,
            longitude: alamat.longitude,
            phone: faker.phone.number({ style: 'international' }),
            description: faker.lorem.paragraph({ min: 3, max: 9 })
        });
    }

    // 2. Insert locations, get their IDs
    const createdLocations = [];
    for (const loc of locations) {
        const created = await prisma.recycleLocation.create({ data: loc });
        createdLocations.push(created);
    }

    // 3. Generate locationCategories
    const locationCategories = [];
    for (const loc of createdLocations) {
        // Random jumlah kategori untuk tiap lokasi (1-3)
        const categoryCount = Math.floor(Math.random() * 3) + 1;
        const usedCategoryIds = new Set();
        for (let j = 0; j < categoryCount; j++) {
            let catId;
            do {
                catId = Math.floor(Math.random() * 5) + 1; // category_id 1-5
            } while (usedCategoryIds.has(catId));
            usedCategoryIds.add(catId);
            locationCategories.push({
                recycle_location_id: loc.id,
                categories_id: catId
            });
        }
    }
    // Insert locationCategories
    for (const cat of locationCategories) {
        await prisma.recycleLocationCategories.create({ data: cat });
    }

    // 4. Generate locationImages
    for (const loc of createdLocations) {
        const imageCount = Math.floor(Math.random() * 4) + 1; // 1-4 images
        for (let k = 1; k <= imageCount; k++) {
            const image_path = `https://dummyimage.com/600x400/000/fff&text=recycle-location${loc.id}-${k}`;
            const image_name = `recycle-location${loc.id}-${k}.jpg`;
            const image_size = 1024 * (Math.floor(Math.random() * 200) + 50); // 50-250 KB
            await prisma.recycleLocationImage.create({
                data: {
                    recycle_location_id: loc.id,
                    image_path,
                    image_name,
                    image_size
                }
            });
        }
    }
}