// Detect if a guild has premium or not

const { Guild } = require("discord.js");
const { getCreditsLeft } = require("./openai");
// const { collections } = require("./mongodb");

/**
 * @param {Guild} guild
 */
async function isPremium(guild) {
  // let row = await collections.premiumGuilds.findOne({ guild_id: guild.id });

  let creditsLeft = await getCreditsLeft();

  if (creditsLeft.available <= 1.5) {
    return false;
  }

  return true;
}

module.exports = isPremium;
