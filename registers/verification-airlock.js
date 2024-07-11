const {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = new SlashCommandBuilder()
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
      .setName("channel")
      .setDescription("Set the verification airlock channel.")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("The channel to set as the verification airlock.")
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("role")
      .setDescription("Set the verification airlock role.")
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription(
            "Multiple roles, one role, add role, or remove a role."
          )
          .addChoices(
            {
              name: "One role",
              value: "one",
            },
            {
              name: "Add role",
              value: "add",
            },
            {
              name: "Remove role",
              value: "remove",
            }
          )
          .setRequired(true)
      )
      .addRoleOption((option) =>
        option
          .setName("role")
          .setDescription("The role to set as the verification airlock.")
          .setRequired(true)
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
