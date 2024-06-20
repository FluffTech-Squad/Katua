// Detect if a guild has premium or not

const { Guild } = require("discord.js");
const { collections } = require("./mongodb");

/**
 * @param {Guild} guild
 */
async function isPremium(guild) {
  let row = await collections.premiumGuilds.findOne({ guild_id: guild.id });

  return !!row;
}

module.exports = isPremium;
