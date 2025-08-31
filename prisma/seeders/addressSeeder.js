// import alamatData from "./sampleData/alamat.json" assert {type: "json"};
// const alamatData = await import('./sampleData/alamat.json', { assert: { type: 'json' } });
const alamatData = [
    {
        "name": "Permata buah batu, lengkong",
        "latitude": -6.9724402,
        "longitude": 107.638862,
        "formattedAddress": "Permata Buah Batu, Lengkong, Bojongsoang, Kabupaten Bandung, Jawa Barat, Jawa, Indonesia",
        "country": "Indonesia",
        "city": "Bojongsoang",
        "state": "Jawa Barat",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    },
    {
        "name": "Jalan sukapura, dayeuhkolot, bandung",
        "latitude": -6.9697397,
        "longitude": 107.634133,
        "formattedAddress": "Jalan Sukapura, Sukapura, Dayeuhkolot, Kabupaten Bandung, Jawa Barat, Jawa, 40257, Indonesia",
        "country": "Indonesia",
        "city": "Dayeuhkolot",
        "state": "Jawa Barat",
        "zipcode": "40257",
        "streetName": "Jalan Sukapura",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    },
    {
        "name": "masjid al muhajirin, cipadung kulon, bandung",
        "latitude": -6.9229148,
        "longitude": 107.7026636,
        "formattedAddress": "Masjid Al-Muhajirin, Jalan Pakuan VI, Cipadung Kulon, Panyileukan, Kota Bandung, Jawa Barat, Jawa, 40614, Indonesia",
        "country": "Indonesia",
        "city": "Kota Bandung",
        "state": "Jawa Barat",
        "zipcode": "40614",
        "streetName": "Jalan Pakuan VI",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    },
    {
        "name": "jalan batumas 2, pasirluyu, regol",
        "latitude": -6.9531779,
        "longitude": 107.6156953,
        "formattedAddress": "Jalan Batumas II, Pasirluyu, Regol, Kota Bandung, Jawa Barat, Jawa, 40255, Indonesia",
        "country": "Indonesia",
        "city": "Kota Bandung",
        "state": "Jawa Barat",
        "zipcode": "40255",
        "streetName": "Jalan Batumas II",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    },
    {
        "name": "Gang babakan jati mulya IV, Gumuruh",
        "latitude": -6.9406336,
        "longitude": 107.6378511,
        "formattedAddress": "Gang Babakan Jati Mulya IV, Gumuruh, Batununggal, Kota Bandung, Jawa Barat, Jawa, 40275, Indonesia",
        "country": "Indonesia",
        "city": "Kota Bandung",
        "state": "Jawa Barat",
        "zipcode": "40275",
        "streetName": "Gang Babakan Jati Mulya IV",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    },
    {
        "name": "RSIA Harapan Bunda, margasari, buahbatu, bandung",
        "latitude": -6.9559278,
        "longitude": 107.662122,
        "formattedAddress": "RSIA Harapan Bunda, Jalan Pluto Raya, Margahayu Raya, Margasari, Buahbatu, Kota Bandung, Jawa Barat, Jawa, 40287, Indonesia",
        "country": "Indonesia",
        "city": "Kota Bandung",
        "state": "Jawa Barat",
        "zipcode": "40287",
        "streetName": "Jalan Pluto Raya",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    },
    {
        "name": "Jalan cikoneng, cluster fashagriya, lengkong, bandung",
        "latitude": -6.9876836,
        "longitude": 107.6460406,
        "formattedAddress": "Jalan Cikoneng, Cluster Fashagriya, Lengkong, Bojongsoang, Kabupaten Bandung, Jawa Barat, Jawa, 40375, Indonesia",
        "country": "Indonesia",
        "city": "Bojongsoang",
        "state": "Jawa Barat",
        "zipcode": "40375",
        "streetName": "Jalan Cikoneng",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    },
    {
        "name": "Cluster amagriya, lengkong, bojongsoang",
        "latitude": -6.9811396,
        "longitude": 107.6391904,
        "formattedAddress": "Cluster Amagriya, Podomoro Park, Lengkong, Bojongsoang, Kabupaten Bandung, Jawa Barat, Jawa, 40288, Indonesia",
        "country": "Indonesia",
        "city": "Bojongsoang",
        "state": "Jawa Barat",
        "zipcode": "40288",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    },
    {
        "name": "Rancamulya, kabupaten bandung, jawa barat 40239",
        "latitude": -7.0038002,
        "longitude": 107.5928156,
        "formattedAddress": "Rancamulya, Kabupaten Bandung, Jawa Barat, Jawa, 40239, Indonesia",
        "country": "Indonesia",
        "city": "Rancamulya",
        "state": "Jawa Barat",
        "zipcode": "40239",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    },
    {
        "name": "Jalan sadewa, bojongmalaka, kabupaten bandung",
        "latitude": -7.002735,
        "longitude": 107.6013476,
        "formattedAddress": "Jalan Sadewa, Bojongmalaka, Kabupaten Bandung, Jawa Barat, Jawa, 40239, Indonesia",
        "country": "Indonesia",
        "city": "Bojongmalaka",
        "state": "Jawa Barat",
        "zipcode": "40239",
        "streetName": "Jalan Sadewa",
        "countryCode": "ID",
        "neighbourhood": "",
        "provider": "openstreetmap"
    }
];

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