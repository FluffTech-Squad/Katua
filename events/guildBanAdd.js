const { GuildBan } = require("discord.js");
const { getMemberThread, isMemberValid } = require("../utils/openai");
const fs = require("fs");
const { collections } = require("../utils/mongodb");

/**
 *
 * @param {GuildBan} ban
 */
module.exports = async (ban) => {
  let thread = await getMemberThread(ban.guild.id, ban.user.id);

  if (thread && !(await isMemberValid(thread))) {
    collections.bans.insertOne({
      user_id: ban.user.id,
      guild_id: ban.guild.id,
    });
  }
};
