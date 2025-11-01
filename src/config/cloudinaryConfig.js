// import dotenv from "dotenv";
// dotenv.config();

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isImage = file.mimetype.startsWith("image/");
    const resourceType = isImage ? "image" : "raw"; // raw for PDF/Word
    const folder = isImage ? "certifications/logos" : "certifications/files";

    const ext = file.originalname.split(".").pop();
    const publicId = file.originalname.split(".")[0]; // keep original name
    return {
      folder,
      resource_type: resourceType,
      public_id: `${publicId}.${ext}`, // append extension here
    };
  },
});

const upload = multer({ storage });

export default upload;
