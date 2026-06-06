const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

const rootFolder = () => process.env.CLOUDINARY_ROOT_FOLDER || "karma-automobiles";
const backendPublicUrl = () => process.env.BACKEND_PUBLIC_URL || "http://localhost:5001";

const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    Readable.from(buffer).pipe(stream);
  });

const sanitize = (name) => String(name || "file").replace(/[^a-zA-Z0-9._-]/g, "-");

const saveLocalFile = async (buffer, folder, filename) => {
  const uploadDir = path.join(__dirname, "..", "..", "uploads", folder);
  await fs.promises.mkdir(uploadDir, { recursive: true });
  const safeName = `${Date.now()}-${sanitize(filename)}`;
  const fullPath = path.join(uploadDir, safeName);
  await fs.promises.writeFile(fullPath, buffer);
  return {
    url: `${backendPublicUrl()}/uploads/${folder}/${safeName}`,
    publicId: `local/${folder}/${safeName}`
  };
};

const uploadImage = async (file, folder) => {
  if (!file?.buffer) {
    const error = new Error("Image file is required");
    error.statusCode = 400;
    throw error;
  }

  const targetFolder = `${rootFolder()}/${folder}`;
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(file.buffer, {
      folder: targetFolder,
      resource_type: "image"
    });
  }

  return saveLocalFile(file.buffer, folder, file.originalname || "image.png");
};

const uploadRaw = async (buffer, folder, filename = "invoice.pdf") => {
  const targetFolder = `${rootFolder()}/${folder}`;
  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, {
      folder: targetFolder,
      resource_type: "raw",
      public_id: sanitize(filename)
    });
  }

  return saveLocalFile(buffer, folder, filename);
};

const deleteFile = async (publicId, resourceType = "image") => {
  if (!publicId) return;
  if (publicId.startsWith("local/")) {
    const relative = publicId.replace("local/", "");
    const fullPath = path.join(__dirname, "..", "..", "uploads", relative);
    await fs.promises.rm(fullPath, { force: true });
    return;
  }
  if (isCloudinaryConfigured()) {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }
};

module.exports = {
  uploadImage,
  uploadRaw,
  deleteFile
};
