const { Client, Partials } = require("discord.js");

// Creating a new Discord client

const client = new Client({
  intents: [
    "Guilds",
    "GuildMessages",
    "GuildMembers",
    "MessageContent",
    "GuildPresences",
    "DirectMessages",
  ],
  partials: [Partials.Channel],
  shards: "auto",
});

let token = require("./utils/token.js");

client.on("ready", require("./events/ready.js"));

client.login(token);
