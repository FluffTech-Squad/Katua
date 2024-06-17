const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setDescription("Analyse a suspicious user's profile.")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to analyse.")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers);
