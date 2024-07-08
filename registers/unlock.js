const { SlashCommandBuilder } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("unlock")
  .setDescription(
    "Unlock a locked channel. Members will be able to send messages again."
  );
