const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("logs")
  .setDescription("Setup logging.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("log-channel")
      .setDescription("Set the logs channel for the server.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel to set as the logs channel.")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("public-channel")
      .setDescription("Set the public logs channel for the server.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel to set as the public logs channel.")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("enable")
      .setDescription("Enable logging.")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The type of logging to enable.")
          .addChoices(
            {
              name: "logging",
              value: "logging",
            },
            {
              name: "inform members",
              value: "inform-members",
            }
          )
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("disable")
      .setDescription("Disable logging.")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The type of logging to disable.")
          .addChoices(
            {
              name: "logging",
              value: "logging",
            },
            {
              name: "inform members",
              value: "inform-members",
            }
          )
          .setRequired(true)
      )
  );
