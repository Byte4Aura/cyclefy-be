import { DateTime } from "luxon";

/**
 * Konversi string waktu Asia/Jakarta ke UTC Date object
 * @param {string} dateString - format "YYYY-MM-DD HH:mm:ss" dari Midtrans
 * @returns {Date} - UTC Date object
 */
export function wibToUtc(dateString) {
    if (!dateString) return null;

    // Parsing dengan zona Asia/Jakarta
    const dt = DateTime.fromFormat(dateString, "yyyy-MM-dd HH:mm:ss", {
        zone: "Asia/Jakarta",
    });

    // Konversi ke UTC dan balikin sebagai Date object native JS
    return dt.toUTC().toJSDate();
}
