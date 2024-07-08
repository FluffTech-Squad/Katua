const { SlashCommandBuilder } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("tickets")
  .setDescription("Setup the ticket system.");
