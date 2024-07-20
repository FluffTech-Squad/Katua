const { Client, Partials, EntitlementType, SKUType } = require("discord.js");
require("dotenv").config();
const { userEmbed } = require("./utils/embedFactory.js");
// Creating a new Discord client
// Code to run the bot
// Docs: readme.md
// Created by: nekomancer0

const fs = require("fs");

// Create a log file per date
let date = new Date();
// Format the date for full date and time

let formattedDate = `${date.getFullYear()}-${
  date.getMonth() + 1
}-${date.getDate()}_${date.getHours()}h${date.getMinutes()}m${date.getSeconds()}s`;

let logsFolder = `${__dirname}/logs`;
let logFilePath = `${logsFolder}/${formattedDate}.log`;

if (!fs.existsSync(logsFolder)) {
  fs.mkdirSync(logsFolder);
}

// Write the log file
process.stdout.write = (function (write) {
  return function (string, encoding, fd) {
    write.apply(process.stdout, arguments);

    let writeStream = fs.createWriteStream(logFilePath, {
      flags: "a",
    });

    writeStream.write(string);

    writeStream.end();
  };
})(process.stdout.write);

// Do the same for the error output

process.stderr.write = (function (write) {
  return function (string, encoding, fd) {
    write.apply(process.stderr, arguments);

    let writeStream = fs.createWriteStream(logFilePath, {
      flags: "a",
    });

    writeStream.write(string);

    writeStream.end();
  };
})(process.stderr.write);

const client = new Client({
  intents: [
    "Guilds",
    "GuildMessages",
    "GuildMembers",
    "MessageContent",
    "GuildPresences",
    "DirectMessages",
    "GuildMessageReactions",
  ],
  partials: [Partials.Channel, Partials.Reaction, Partials.Message],
  shards: "auto",
});

let token = require("./utils/token.js");
client.on("ready", require("./events/ready.js"));

client.on("entitlementCreate", async (entitlement) => {
  let skus = await entitlement.client.application.fetchSKUs();

  let sku = skus.get(entitlement.skuId);

  console.log(sku, entitlement);

  let user = await entitlement.fetchUser();

  let embed = userEmbed(user)
    .setTitle("Purchase")
    .setDescription(
      "Purchases are actually work in progress. If you want your grants now, join our Discord Server at katua.xyz and contact the owner."
    );

  try {
    await user.send({
      embeds: [embed],
    });
  } catch (e) {
    console.log(e);
  }
});

client.login(token);
