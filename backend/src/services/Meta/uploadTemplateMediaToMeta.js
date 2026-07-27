const axios = require("axios");
const fs = require("fs");
const mime = require("mime-types");
const path = require("path");

const uploadTemplateMediaToMeta = async ({ filePath, accessToken }) => {
  try {
    const fileSize = fs.statSync(filePath).size;
    const mimeType = mime.lookup(filePath);

    if (!mimeType) {
      throw new Error("Cannot detect mime type");
    }

    const fileName = path.basename(filePath);

    /* ================= STEP 1: Start Upload Session ================= */

    const startSessionUrl = `https://graph.facebook.com/${process.env.META_API_VERSION}/${process.env.META_APP_ID}/uploads`;

    const startRes = await axios.post(
      startSessionUrl,
      {
        file_name: fileName,
        file_length: fileSize,
        file_type: mimeType,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const uploadSessionId = startRes.data.id;

    if (!uploadSessionId) {
      throw new Error("Failed to create upload session");
    }

    /* ================= STEP 2: Upload Binary ================= */

    const uploadUrl = `https://graph.facebook.com/${process.env.META_API_VERSION}/${uploadSessionId}`;

    const fileBuffer = fs.readFileSync(filePath);

    const uploadRes = await axios.post(uploadUrl, fileBuffer, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
        "Content-Length": fileSize,
        "Offset": 0,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    const mediaHandle = uploadRes.data.h;

    if (!mediaHandle) {
      console.error("Upload response:", uploadRes.data);
      throw new Error("Meta did not return media handle");
    }

    console.log("TEMPLATE MEDIA HANDLE:", mediaHandle);

    return mediaHandle;

  } catch (error) {
    console.error("TEMPLATE MEDIA UPLOAD FAILED:", error.response?.data || error.message);
    throw new Error("Template media upload failed");
  }
};

module.exports = uploadTemplateMediaToMeta;
