const { SlashCommandBuilder } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Check the bot's latency.");
