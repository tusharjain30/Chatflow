const getBaseUrl = () => {
  // If PUBLIC_BASE_URL is set (for ngrok or production)
  if (process.env.PUBLIC_BASE_URL) {
    return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  }

  // Fallback to local server
  const port = process.env.PORT || 4000;
  return `http://localhost:${port}`;
};

const buildMediaUrl = (folder, fileName) => {
  if (!folder || !fileName) return null;

  const baseUrl = getBaseUrl();
  return `${baseUrl}/uploads/${folder}/${fileName}`;
};

module.exports = { buildMediaUrl };

