const { loadImage, createCanvas, registerFont } = require("canvas");
const getBase64ImageURL = require("./getBase64ImageURL");

let generateBanner = async (...text) => {
  registerFont(`${process.cwd()}/assets/Kanit-SemiBold.ttf`, {
    family: "Kanit SemiBold",
  });

  const background = await loadImage(`${process.cwd()}/assets/banner.png`);
  const canvas = createCanvas(900, 300);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

  ctx.font = '65px "Kanit SemiBold"';
  let rainbowGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  rainbowGradient.addColorStop(0, "#ff0000");
  rainbowGradient.addColorStop(0.17, "#ff7f00");
  rainbowGradient.addColorStop(0.33, "#ffff00");
  rainbowGradient.addColorStop(0.5, "#00ff00");
  rainbowGradient.addColorStop(0.67, "#0000ff");
  rainbowGradient.addColorStop(0.83, "#4b0082");
  rainbowGradient.addColorStop(1, "#8f00ff");

  ctx.fillStyle = rainbowGradient;
  ctx.textAlign = "center";
  ctx.fillText(text[0], canvas.width / 2, canvas.height / 2 + 10);

  // Inline text array

  let i = 1;

  for (let t of text.slice(1)) {
    let firstTextPosition = canvas.height / 2 + 10;

    ctx.font = '50px "Kanit SemiBold"';
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(t, canvas.width / 2, firstTextPosition + i * 70);

    i += 1;
  }

  return {
    base64: await getBase64ImageURL(canvas.toDataURL("image/png")),
    buffer: canvas.toBuffer(),
    canvas,
  };
};

module.exports = generateBanner;
