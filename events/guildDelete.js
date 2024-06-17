// Event when the bot leaves a guild

const { Guild } = require("discord.js");
const fs = require("fs");
const isPremium = require("../isPremium");

module.exports =
  /**
   * @param {Guild} guild
   */
  async (guild) => {
    if (!(await isPremium(guild))) return;

    let guildsFolder = __dirname.replace("events", "guilds");
    let guildFilePath = `${guildsFolder}/${guild.id}.json`;

    let guildsRulesFolder = `${guildsFolder}/rules`;
    let guildRulesFile = `${guildsRulesFolder}/${guild.id}.json`;

    if (fs.existsSync(guildFilePath)) {
      fs.unlinkSync(guildFilePath);
      fs.rmSync(guildFilePath);
    }

    if (fs.existsSync(guildRulesFile)) {
      fs.unlinkSync(guildRulesFile);
      fs.rmSync(guildRulesFile);
    }
  };
