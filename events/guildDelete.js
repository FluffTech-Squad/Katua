// Event when the bot leaves a guild

const { Guild } = require("discord.js");
const fs = require("fs");

module.exports =
  /**
   * @param {Guild} guild
   */
  async (guild) => {
    let guildsFolder = __dirname.replace("events", "guilds");
    let guildFilePath = `${guildsFolder}/${guild.id}.json`;

    if (fs.existsSync(guildFilePath)) {
      fs.unlinkSync(guildFilePath);
      fs.rmSync(guildFilePath);
    }
  };
