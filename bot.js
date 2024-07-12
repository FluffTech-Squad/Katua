const { Client, Partials, EntitlementType } = require("discord.js");
require("dotenv").config();

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
  console.log(entitlement);

  if (!entitlement.guildId) return;
  if (entitlement.isGuildSubscription()) return;

  // Entitlement must be a consumable

  if (entitlement.type !== EntitlementType.Purchase) return;

  if (entitlement.id === "1259985665475612702") {
    // 1 Month Katua Premium Features, Consumable

    let user = await entitlement.fetchUser();
  }
});

client.login(token);
