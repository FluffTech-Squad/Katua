// Config slash command register

const { SlashCommandBuilder, ChannelType } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Configure the bot for your guild.")
  .addSubcommandGroup((group) =>
    group
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
      )
  )
  .addSubcommandGroup((group) =>
    group
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
      )
  )
  .addSubcommandGroup((group) =>
    group
      .setName("verification-airlock")
      .setDescription("Setup the verification airlock.")
      .addSubcommand((subcommand) =>
        subcommand
          .setName("enable")
          .setDescription("Enable the verification airlock.")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("disable")
          .setDescription("Disable the verification airlock.")
      )
      .addSubcommand((subcommand) =>
        subcommand
          .setName("set")
          .setDescription("Set the verification airlock channel.")
          .addChannelOption((option) =>
            option
              .setName("channel")
              .setDescription("The channel to set as the verification airlock.")
              .setRequired(true)
              .addChannelTypes(ChannelType.GuildText)
          )
          .addRoleOption((option) =>
            option
              .setName("role")
              .setDescription("The role to set as the verified role.")
              .setRequired(true)
          )
          .addChannelOption((option) =>
            option
              .setName("katua-result-channel")
              .setDescription(
                "The channel to set as the katua log channel when members sends the verification message."
              )
              .setRequired(false)
              .addChannelTypes(ChannelType.GuildText)
          )
      )
  )

  .addSubcommand((opt) =>
    opt
      .setName("show")
      .setDescription("Show the current configuration.")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The type of configuration to show.")
          .addChoices(
            {
              name: "logging",
              value: "logging",
            },
            {
              name: "filters",
              value: "filters",
            },
            {
              name: "troll-detection",
              value: "detector-prompt",
            }
          )
          .setRequired(false)
      )
  );
