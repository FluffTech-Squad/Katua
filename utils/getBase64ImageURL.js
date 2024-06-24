const { createCanvas, loadImage } = require("canvas");

/**
 *
 * @param {string} url
 * @returns {Promise<string>}
 */
async function getBase64ImageURL(url) {
  let img = await loadImage(url);
  var canvas = createCanvas(img.width, img.height);

  var ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);
  var dataURL = canvas.toDataURL("image/png");

  return dataURL.split(",")[1];
}

function base64ToArrayBuffer(base64) {
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);

  return Buffer.from(bytes, "base64");
}

getBase64ImageURL.base64ToArrayBuffer = base64ToArrayBuffer;

module.exports = getBase64ImageURL;
