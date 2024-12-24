// Event when the bot leaves a guild

const { Guild } = require("discord.js");
const { collections } = require("../utils/mongodb");

module.exports =
  /**
   * @param {Guild} guild
   */
  async (guild) => {
    console.log("Guild left: ", guild.name, `(${guild.id})`);

    await collections.guilds.deleteOne({ guild_id: guild.id });
    await collections.guildRules.deleteOne({ guild_id: guild.id });
  };
