import multer from "multer";
import path from "path";
import fs from "fs";
import { dir } from "console";

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const directory = path.resolve("src/assets/profiles");
        if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
        callback(null, directory);
    },
    filename: (req, file, callback) => {
        const extension = path.extname(file.originalname);
        const filename = `user_${req.user.id}_${Date.now()}${extension}`;
        callback(null, filename);
    }
});

const fileFilter = (req, file, callback) => {
    // Allow image only
    if (file.mimetype.startsWith("image/")) callback(null, true);
    else callback(new Error("file.image_only"));
}

export const uploadProfilePictureMiddleware = multer({
    storage: storage,
    fileFilter: fileFilter
}).single("profile_picture");