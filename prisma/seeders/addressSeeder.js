import alamatData from "./sampleData/alamat.json" assert {type: "json"};

export default async function addressSeeder(prisma, users) {
    // Distribute addresses to users in round-robin
    const alamatList = Object.values(alamatData);
    for (let i = 0; i < alamatList.length; i++) {
        const user = users[i % users.length];
        const alamat = alamatList[i];
        await prisma.address.create({
            data: {
                user_id: user.id,
                // address_name: alamat.formattedAddress.split(",")[0],
                address_name: "Rumah",
                address: alamat.formattedAddress,
                latitude: alamat.latitude,
                longitude: alamat.longitude,
                city: alamat.city || "",
                state: alamat.state || "",
                country: alamat.country || "",
                country_code: alamat.countryCode || "",
                zipcode: alamat.zipcode || "",
            }
        });
    }
}