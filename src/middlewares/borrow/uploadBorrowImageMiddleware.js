import multer from "multer";
import path from "path";
import fs from "fs";

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const directory = path.resolve("src/assets/borrows/postings");
        if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
        callback(null, directory);
    },
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname);
        const filename = `borrow_post_${req.user.id}_${Date.now()}${extension}`;
        callback(null, filename);
    }
});

const fileFilter = (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) callback(null, true);
    else callback(new Error("file.image_only"));
};

export const uploadBorrowImageMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter,
    // limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array("images");