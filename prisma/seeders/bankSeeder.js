export default async function bankSeeder(prisma) {
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