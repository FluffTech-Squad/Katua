// Rules slash command to set rules in a guild for the bot to perform moderation actions.

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("rules")
  .setDescription("Enable or disable a server rule for the bot.")
  .addSubcommand((sc) =>
    sc
      .setName("nsfw-filter")
      .setDescription("Enable or disable the NSFW filter in non-NSFW channels.")
  )
  .addSubcommand((sc) =>
    sc
      .setName("word-filter")
      .setDescription("Enable or disable the NSFW filter in non-NSFW channels.")
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);
