const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

let langs = require("../langs.json");

let slashCommand = new SlashCommandBuilder()
  .setDescription("Analyse a suspicious user's profile.")
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("The user to analyse.")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionsBitField.Flags.ModerateMembers);

let locales = Object.keys(langs);

for (let locale of locales) {
  slashCommand.setNameLocalization(
    locale,
    langs[locale]["helpCommands"]["analyse"]["localeName"]
  );
  slashCommand.setDescriptionLocalization(
    locale,
    langs[locale]["helpCommands"]["analyse"]["localeDescription"]
  );
}

module.exports = slashCommand;
