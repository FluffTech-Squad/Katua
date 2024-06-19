// Rules slash command to set rules in a guild for the bot to perform moderation actions.

const { ChannelType, ChatInputCommandInteraction } = require("discord.js");
const fs = require("fs");
const langs = require("../utils/langs.js");
/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
module.exports = (interaction) => {
  // Get the guild
  let guild = interaction.guild;

  if (interaction.channel.type === ChannelType.DM) return;
  let lang = guild.preferredLocale || "en-US";

  let sentences = langs[lang];

  // Get the guild rules settings

  let guildRulesPath = `./guilds/rules/${guild.id}.json`;

  let guildRulesData = {
    wordFilter: true,
    nsfwFilter: true,
  };

  if (fs.existsSync(guildRulesPath)) {
    guildRulesData = JSON.parse(fs.readFileSync(guildRulesPath, "utf-8"));
  }

  function save() {
    fs.writeFileSync(guildRulesPath, JSON.stringify(guildRulesData));
  }

  if (!fs.existsSync(guildRulesPath)) save();
  let rule = interaction.options.getSubcommand();

  if (rule === "nsfw-filter") {
    guildRulesData.nsfwFilter = !guildRulesData.nsfwFilter;

    save();

    interaction.reply(
      sentences.ruleCommand["nsfw-filter-text"].replace(
        "$1",
        guildRulesData.nsfwFilter
          ? sentences.words["enabled"]
          : sentences.words["disabled"]
      )
    );
  } else if (rule === "word-filter") {
    guildRulesData.wordFilter = !guildRulesData.wordFilter;

    save();

    interaction.reply(
      sentences.ruleCommand["word-filter-text"].replace(
        "$1",
        guildRulesData.wordFilter
          ? sentences.words["enabled"]
          : sentences.words["disabled"]
      )
    );
  }
};
