const { SlashCommandBuilder } = require("discord.js");

let langs = require("../langs.json");

let slashCommand = new SlashCommandBuilder().setDescription(
  "Get list of commands."
);

let locales = Object.keys(langs);

for (let locale of locales) {
  slashCommand.setNameLocalization(
    locale,
    langs[locale]["helpCommands"]["help"]["localeName"]
  );
  slashCommand.setDescriptionLocalization(
    locale,
    langs[locale]["helpCommands"]["help"]["localeDescription"]
  );
}

module.exports = slashCommand;
