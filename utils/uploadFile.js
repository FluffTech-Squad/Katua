const { Client } = require("@rmp135/imgur");
const generateBanner = require("./generateBanner");

require("dotenv").config();

let ImgurClient = new Client({
  client_id: process.env.IMGUR_CLIENT_ID,
  client_secret: process.env.IMGUR_CLIENT_SECRET,
});

/**
 *
 * @param {string} base64
 * @returns {Promise<string>}
 *
 * Get imgur url
 */
async function uploadFile(base64) {
  try {
    let res = await ImgurClient.Image.upload(base64, { type: "base64" });
    if (res && res.data && res.data.link) return res.data.link;
    return null;
  } catch (e) {
    return null;
  }
}

module.exports = uploadFile;
