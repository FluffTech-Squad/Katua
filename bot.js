const { Client, Partials } = require("discord.js");
require("dotenv").config();

// Creating a new Discord client
// Code to run the bot
// Docs: readme.md
// Created by: nekomancer0

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

client.login(token);
