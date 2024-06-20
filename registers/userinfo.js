const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("userinfo")
  .setDescription("Get information about a user.")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to get information about.")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers);
