const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("lock")
  .setDescription(
    "Lock a channel. Members will not be able to send messages until unlocked."
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);
