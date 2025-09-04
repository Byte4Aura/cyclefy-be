import { prismaClient } from "../application/database.js";
import { ResponseError } from "../errors/responseError.js";
import { env } from "../application/env.js";
import crypto from "crypto";

/**
 * Helper untuk validasi signature key dari Midtrans (opsional tapi best practice)
 */
function isValidMidtransSignature(notification) {
    const { order_id, status_code, gross_amount, signature_key } = notification;
    const serverKey = env.midtrans.serverKey;
    const rawSignature = order_id + status_code + gross_amount + serverKey;
    const expectedSignature = crypto.createHash('sha512').update(rawSignature).digest('hex');
    return signature_key === expectedSignature;
}

/**
 * Mapping status Midtrans ke status internal RepairPaymentStatus
 */
function mapMidtransStatus(transactionStatus, fraudStatus) {
    if (transactionStatus === "settlement" || transactionStatus === "capture") return "paid";
    if (transactionStatus === "pending") return "pending";
    if (transactionStatus === "expire") return "expired";
    if (transactionStatus === "cancel" || transactionStatus === "deny") return "failed";
    if (transactionStatus === "refund" || transactionStatus === "chargeback") return "cancelled";
    return "pending";
}

const midtransNotification = async (req, res, next) => {
    try {
        const notification = req.body;
        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;
        const paidAt = notification.settlement_time ? new Date(notification.settlement_time) : null;
        const expiredAt = notification.expiry_time ? new Date(notification.expiry_time) : null;

        // (Opsional) Validasi signature
        // if (!isValidMidtransSignature(notification)) {
        //     throw new ResponseError(403, "Invalid Midtrans signature");
        // }

        // Temukan payment berdasarkan order_id
        const payment = await prismaClient.repairPayment.findUnique({ where: { order_id: orderId } });
        if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });

        // Mapping status
        const status = mapMidtransStatus(transactionStatus, fraudStatus);

        // Update payment di database
        await prismaClient.repairPayment.update({
            where: { id: payment.id },
            data: {
                status,
                paid_at: status === "paid" ? paidAt : null,
                expired_at: status === "expired" ? expiredAt : null,
                // Simpan info lain jika perlu (va_number, qris_url, dsb)
            }
        });

        // (Opsional) Update status Repair jika payment paid
        if (status === "paid") {
            await prismaClient.repairStatusHistory.create({
                data: {
                    repair_id: payment.repair_id,
                    status: "confirmed",
                    status_detail: "Payment received, repair confirmed",
                    updated_by: payment.user_id
                }
            });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
};

export default {
    midtransNotification
};