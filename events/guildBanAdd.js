const { GuildBan } = require("discord.js");
const { getMemberThread, isMemberValid } = require("../utils/openai");
const fs = require("fs");

/**
 *
 * @param {GuildBan} ban
 */
module.exports = async (ban) => {
  let banCountPath = __dirname.replace("events", "ban_count.txt");
  let banCountFile = fs.readFileSync(banCountPath, "utf-8");

  let thread = await getMemberThread(ban.guild.id, ban.user.id);

  if (!(await isMemberValid(thread))) {
    let banCount = parseInt(banCountFile);
    banCount++;

    fs.writeFileSync(banCountPath, banCount.toString());
  }
};
