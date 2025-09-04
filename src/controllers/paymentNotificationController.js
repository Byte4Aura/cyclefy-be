import { prismaClient } from "../application/database.js";

const midtransNotification = async (req, res) => {
    const notification = req.body;
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;

    // Temukan payment berdasarkan order_id
    const payment = await prismaClient.repairPayment.findUnique({ where: { order_id: orderId } });
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

    // Update status payment
    let status = "pending";
    if (transactionStatus === "settlement" || transactionStatus === "capture") status = "paid";
    else if (transactionStatus === "expire") status = "expired";
    else if (transactionStatus === "cancel" || transactionStatus === "deny") status = "failed";

    await prismaClient.repairPayment.update({
        where: { id: payment.id },
        data: { status }
    });

    res.status(200).json({ success: true });
};

export default {
    midtransNotification
}