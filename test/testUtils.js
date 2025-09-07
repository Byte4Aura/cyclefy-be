// test/testUtils.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Clear all data from tables that are relevant for tests.
 * Add more tables as needed.
 */

export async function clearDatabase() {
    // 1. Status histories, images, payments, applications, etc (child tables)
    await prisma.repairPayment.deleteMany();
    await prisma.repairStatusHistory.deleteMany();
    await prisma.repairImage.deleteMany();
    await prisma.recycleStatusHistory.deleteMany();
    await prisma.recycleImage.deleteMany();
    await prisma.donationStatusHistory.deleteMany();
    await prisma.donationImage.deleteMany();
    await prisma.barterStatusHistory.deleteMany();
    await prisma.barterImage.deleteMany();
    await prisma.borrowStatusHistory.deleteMany();
    await prisma.borrowImage.deleteMany();
    // Applications (borrow, barter)
    if (prisma.borrowApplicationStatusHistory) await prisma.borrowApplicationStatusHistory.deleteMany();
    if (prisma.borrowApplication) await prisma.borrowApplication.deleteMany();
    if (prisma.barterApplicationStatusHistory) await prisma.barterApplicationStatusHistory.deleteMany();
    if (prisma.barterApplication) await prisma.barterApplication.deleteMany();
    if (prisma.barterApplicationImage) await prisma.barterApplicationImage.deleteMany();
    // Recycle location (if needed)
    if (prisma.recycleLocationImage) await prisma.recycleLocationImage.deleteMany();
    if (prisma.recycleLocationCategories) await prisma.recycleLocationCategories.deleteMany();
    if (prisma.recycleLocation) await prisma.recycleLocation.deleteMany();

    // 2. Parent tables (main data)
    await prisma.repair.deleteMany();
    await prisma.recycle.deleteMany();
    await prisma.donation.deleteMany();
    await prisma.barter.deleteMany();
    await prisma.borrow.deleteMany();

    // 3. Address, phone
    await prisma.address.deleteMany();
    await prisma.phone.deleteMany();

    // 4. User-related (EmailVerification, Oauth, PasswordReset)
    if (prisma.emailVerification) await prisma.emailVerification.deleteMany();
    if (prisma.userOauthProvider) await prisma.userOauthProvider.deleteMany();
    if (prisma.passwordReset) await prisma.passwordReset.deleteMany();

    // 5. Terakhir, user
    await prisma.user.deleteMany();
}

export { prisma };
