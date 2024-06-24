const { GuildBan } = require("discord.js");
const { getUserThread, isMemberValid } = require("../utils/openai");
const { collections } = require("../utils/mongodb");

/**
 *
 * @param {GuildBan} ban
 */
module.exports = async (ban) => {
  let thread = await getUserThread(ban.user.id);

  if (thread && !(await isMemberValid(thread))) {
    collections.bans.insertOne({
      user_id: ban.user.id,
      guild_id: ban.guild.id,
    });
  }
};
