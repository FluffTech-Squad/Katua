/*  _______________      _______________       ______  ___     _________
    ___  ____/__  /___  ____  __/__  __/____  ____   |/  /___________  /
    __  /_   __  /_  / / /_  /_ __  /_ __  / / /_  /|_/ /_  __ \  __  / 
    _  __/   _  / / /_/ /_  __/ _  __/ _  /_/ /_  /  / / / /_/ / /_/ /  
    /_/      /_/  \__,_/ /_/    /_/    _\__, / /_/  /_/  \____/\__,_/   
                                       /____/                           
*/

// Code to run the bot
// FluffyMod is a AI-powered moderator Discord Bot to analyse joining members' profile to make furry servers safer.
// Created by: nekomancer0

const fs = require("fs");
const AdmZip = require("adm-zip");

// Create a log file per date
let date = new Date();
// Format the date for full date and time

let formattedDate = `${date.getFullYear()}-${
  date.getMonth() + 1
}-${date.getDate()}_${date.getHours()}h${date.getMinutes()}m${date.getSeconds()}s`;

let logsFolder = `${__dirname}/logs`;
let logFilePath = `${logsFolder}/${formattedDate}.log`;

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

// Importing the discord.js module

const Discord = require("discord.js");

// Creating a new Discord client

const client = new Discord.Client({
  intents: [
    "Guilds",
    "GuildMessages",
    "GuildMembers",
    "MessageContent",
    "GuildPresences",
    "DirectMessages",
  ],
  partials: [Discord.Partials.Channel],
});

// Use dotenv to hide the token

require("dotenv").config();
require("./utils/mongodb.js");

const token = process.env.TOKEN;

client.on("ready", require("./events/ready.js"));

client.login(token);
