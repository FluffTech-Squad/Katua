const fs = require("fs");
let langsFolder = process.cwd() + "/langs";

let files = fs.readdirSync(langsFolder);

let langs = {};

for (let file of files) {
  let lang = require(`${langsFolder}/${file}`);

  langs[file.split(".")[0]] = lang;
}

module.exports = langs;
