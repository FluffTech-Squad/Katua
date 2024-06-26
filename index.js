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

// Importing the discord.js module
require("dotenv").config();
require("./utils/mongodb.js");
let token = require("./utils/token.js");

require("./bot.js");

// const { ShardingManager } = require("discord.js");

// let args = process.argv.slice(2);

// const manager = new ShardingManager("./bot.js", {
//   token,
//   mode: "process",
//   shardArgs: args,
// });

// manager.on("shardCreate", (shard) => console.log(`Launched shard ${shard.id}`));

// manager.spawn({ amount: 4 });
