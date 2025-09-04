import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const directory = path.resolve("src/assets/repairs");
        if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
        callback(null, directory);
    },
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname);
        const type = file.fieldname; // 'front_view' atau 'close_up_damage'
        const userId = req.user.id;
        const timestamp = Date.now();
        // Sementara: userId_type_timestamp.ext
        const filename = `${userId}_${type}_${timestamp}${extension}`;
        callback(null, filename);
    }
});

const fileFilter = (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) callback(null, true);
    else callback(new Error("file.image_only"));
};

export const uploadRepairImageMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    // limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).fields([
    { name: "front_view", maxCount: 5 },
    { name: "close_up_damage", maxCount: 5 }
]);