// Detect if a guild has premium or not

const { Guild } = require("discord.js");
const fs = require("fs");

/**
 * @param {Guild} guild
 */
async function isPremium(guild) {
  let premiumGuildsFile = fs.readFileSync("./premium_guilds.txt", "utf-8");
  let premiumGuilds = premiumGuildsFile.split("\n");
  let premiumGuildsIds = premiumGuilds.map((g) => g.split(" ")[1]);

  return premiumGuildsIds.includes(guild.id);
}

module.exports = isPremium;
