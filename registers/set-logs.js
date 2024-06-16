const {
  SlashCommandBuilder,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");

const langs = require("../langs.json");

let slashCommand = new SlashCommandBuilder()
  .setDescription("Set the logs channel for the server.")
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to set as the logs channel.")
      .setRequired(true)
      .addChannelTypes(ChannelType.GuildText)
  )
  .addChannelOption((option) =>
    option
      .setName("public-channel")
      .setDescription("The channel to set for the bot to inform members.")
      .setRequired(false)
      .addChannelTypes(ChannelType.GuildText)
  )
  .addStringOption((option) =>
    option
      .setName("prevent-members")
      .setDescription("Set to true for members to be notified.")
      .setChoices([
        { name: "True", value: "true" },
        { name: "False", value: "false" },
      ])
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild);

let locales = Object.keys(langs);

for (let locale of locales) {
  slashCommand.setNameLocalization(
    locale,
    langs[locale]["helpCommands"]["set-logs"]["localeName"]
  );
  slashCommand.setDescriptionLocalization(
    locale,
    langs[locale]["helpCommands"]["set-logs"]["localeDescription"]
  );
}

module.exports = slashCommand;
