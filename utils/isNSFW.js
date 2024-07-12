const nsfw = require("nsfwjs");
const { createCanvas, loadImage } = require("canvas");

/**
 *
 * @param {string} url
 */
async function isNSFW(url) {
  try {
    let model = await nsfw.load("InceptionV3");
    let img = await loadImage(url);
    let canvas = createCanvas(img.width, img.height);
    let ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    let predictions = await model.classify(canvas);

    let itIs = true;

    // Sort the predictions by probability

    predictions = predictions.sort((a, b) => b.probability - a.probability);
    console.log(predictions);

    if (predictions[0].className === "Neutral") itIs = false;
    if (predictions[0].className === "Drawing") itIs = false;

    return itIs;
  } catch {
    return false;
  }
}

module.exports = isNSFW;
