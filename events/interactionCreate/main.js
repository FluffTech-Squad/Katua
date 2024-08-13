const { Interaction } = require("discord.js");
const { collections } = require("../../utils/mongodb");

/**
 *
 * @param {Interaction} interaction
 * @returns
 */
module.exports = async (interaction) => {
  if (!interaction.guild) return;
  if (interaction.user.bot) return;

  let guildData = await collections.guilds.findOne({
    guild_id: interaction.guild.id,
  });

  if (!guildData) {
    await collections.guilds.insertOne({
      guild_id: interaction.guild.id,
    });
  }

  let guildRulesData = await collections.guildRules.findOne({
    guild_id: interaction.guild.id,
  });

  if (!guildRulesData) {
    await collections.guildRules.insertOne({
      guild_id: interaction.guild.id,
      "nsfw-filter": true,
      "word-filter": true,
    });
  }
};
