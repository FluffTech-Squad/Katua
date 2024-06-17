const { SlashCommandBuilder } = require("discord.js");

module.exports = new SlashCommandBuilder().setDescription(
  "Check the bot's latency."
);
