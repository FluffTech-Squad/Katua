// Code to run the bot
// FluffyMod is a AI-powered moderator Discord Bot to analyse joining members' profile to make furry servers safer.
// Created by: nekomancer0

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
  ],
});

// Use dotenv to hide the token

require("dotenv").config();

const token = process.env.TOKEN;
const fs = require("fs");

// Load events

const eventFiles = fs
  .readdirSync("./events")
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(`./events/${file}`);

  let name = file.split(".")[0];

  client.on(name, event);
}

client.login(token);
