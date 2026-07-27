const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Detect folder based on mimetype
const getFolderName = (mimeType) => {
    if (mimeType.startsWith("image")) return "images";
    if (mimeType.startsWith("video")) return "videos";
    if (mimeType.includes("pdf") || mimeType.includes("document")) return "documents";
    return "others";
};

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folder = getFolderName(file.mimetype);

        // Always use PROJECT ROOT path (NOT __dirname)
        const uploadPath = path.join(process.cwd(), "uploads", folder);
        

        // Create folder if missing
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        // Save folder name in req for URL building later
        req.uploadFolder = folder;

        cb(null, uploadPath);
    },

    filename: (req, file, cb) => {
        const cleanedName = file.originalname.replace(/\s+/g, "_");
        const uniqueName = Date.now() + "-" + cleanedName;

        // Save file name also for URL building in API
        req.uploadedFileName = uniqueName;

        cb(null, uniqueName);
    }
});

// File filters
const fileFilter = (req, file, cb) => {
    const allowed = ["image", "video", "pdf", "application", "text", "audio"];

    if (!allowed.some(type => file.mimetype.startsWith(type))) {
        return cb(new Error("Unsupported file type"), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

module.exports = upload;
