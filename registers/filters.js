const { SlashCommandBuilder } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("filters")
  .setDescription("Setup filters.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("enable")
      .setDescription("Enable a filter.")
      .addStringOption((option) =>
        option
          .setName("filter")
          .setDescription("The filter to enable.")
          .addChoices(
            {
              name: "NSFW Filter",
              value: "nsfw-filter",
            },
            {
              name: "Inappropriate Language Filter",
              value: "word-filter",
            }
          )
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("disable")
      .setDescription("Disable a filter.")
      .addStringOption((option) =>
        option
          .setName("filter")
          .setDescription("The filter to disable.")
          .addChoices(
            {
              name: "NSFW Filter",
              value: "nsfw",
            },
            {
              name: "Inappropriate Language Filter",
              value: "inappropriate-language",
            }
          )
          .setRequired(true)
      )
  );
