import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const normalizedPath = path.resolve(localFilePath);

    const response = await cloudinary.uploader.upload(normalizedPath, {
      resource_type: "auto",
    });
    // console.log("file is uploaded on Cloudinary:", response.url); // ✅ Log the response

    fs.unlinkSync(localFilePath); // Clean up local file
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error); // ✅ Log the real error
    fs.unlinkSync(localFilePath); // Still clean up
    return null;
  }
};

export { uploadOnCloudinary };
