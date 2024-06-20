// Rules slash command to set rules in a guild for the bot to perform moderation actions.

const { ChannelType, ChatInputCommandInteraction } = require("discord.js");

const langs = require("../utils/langs.js");
const { collections } = require("../utils/mongodb.js");
/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
module.exports = async (interaction) => {
  // Get the guild
  let guild = interaction.guild;

  if (interaction.channel.type === ChannelType.DM) return;
  let lang = guild.preferredLocale || "en-US";

  let sentences = langs[lang];
  // Get the guild rules settings

  let dbGuildRules = await collections.guildRules.findOne({
    guild_id: guild.id,
  });

  let rule = interaction.options.getSubcommand();

  if (!dbGuildRules) {
    await collections.guildRules.insertOne({
      guild_id: guild.id,
      nsfwFilter: false,
      wordFilter: false,
    });

    dbGuildRules = await collections.guildRules.findOne({ guild_id: guild.id });
  }

  if (rule === "nsfw-filter") {
    let data = dbGuildRules;

    data.nsfwFilter = !data.nsfwFilter;

    await collections.guildRules.updateOne(
      { guild_id: guild.id },
      { $set: { nsfwFilter: data.nsfwFilter } }
    );

    interaction.reply(
      sentences.ruleCommand["nsfw-filter-text"].replace(
        "$1",
        data.nsfwFilter
          ? sentences.words["enabled"]
          : sentences.words["disabled"]
      )
    );
  } else if (rule === "word-filter") {
    let data = dbGuildRules;

    data.wordFilter = !data.wordFilter;

    await collections.guildRules.updateOne(
      { guild_id: guild.id },
      { $set: { wordFilter: data.wordFilter } }
    );

    interaction.reply(
      sentences.ruleCommand["word-filter-text"].replace(
        "$1",
        data.wordFilter
          ? sentences.words["enabled"]
          : sentences.words["disabled"]
      )
    );
  }
};
