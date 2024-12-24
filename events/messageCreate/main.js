const { Message } = require("discord.js");
const { collections } = require("../../utils/mongodb");

let { guilds, guildRules } = collections;

/**
 * @param {Message} message
 */
module.exports = async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  let guildData = await guilds.findOne({ guild_id: message.guild.id });

  if (!guildData) {
    let systemChannel = message.guild.systemChannel;

    await collections.guilds.insertOne({
      guild_id: message.guild.id,
    });
  }

  let guildRulesData = await guildRules.findOne({ guild_id: message.guild.id });

  if (!guildRulesData) {
    await collections.guildRules.insertOne({
      guild_id: message.guild.id,
      "nsfw-filter": true,
      "word-filter": false,
    });
  }
};
