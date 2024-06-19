// Detect if a guild has premium or not

const { Guild } = require("discord.js");
const fs = require("fs");

let premiumFilePath = __dirname.replace("utils", "premium_guilds.txt");
/**
 * @param {Guild} guild
 */
async function isPremium(guild) {
  let premiumGuildsFile = fs.readFileSync(premiumFilePath, "utf-8");
  let premiumGuilds = premiumGuildsFile.split("\n");

  // Get guild Ids, the lines finishes with a \r except the last one, remove them

  let premiumGuildsIds = premiumGuilds.map((g) =>
    g.split(" ")[1].replace("\r", "")
  );

  return premiumGuildsIds.includes(guild.id);
}

async function isPremiumID(guild_id) {
  let premiumGuildsFile = fs.readFileSync(premiumFilePath, "utf-8");
  let premiumGuilds = premiumGuildsFile.split("\n");

  // Get guild Ids, the lines finishes with a \r except the last one, remove them

  let premiumGuildsIds = premiumGuilds.map((g) =>
    g.split(" ")[1].replace("\r", "")
  );

  return premiumGuildsIds.includes(guild_id);
}

isPremium.id = isPremiumID;

module.exports = isPremium;