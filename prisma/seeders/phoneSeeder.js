function getRandomPhoneNumber() {
    // Format: 08xxxxxxxxxx (12 digit)
    const prefix = "08";
    let number = prefix;
    for (let i = 0; i < 10; i++) {
        number += Math.floor(Math.random() * 10);
    }
    return number;
}

export default async function phoneSeeder(prisma, users) {
    // Setiap user dapat 1 nomor, atau bisa lebih jika mau
    for (const user of users) {
        await prisma.phone.create({
            data: {
                user_id: user.id,
                number: getRandomPhoneNumber(),
            }
        });
    }
}