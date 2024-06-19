// guildMemberRemove event

const { PartialGuildMember } = require("discord.js");
const fs = require("fs");
const {
  openai,
  getMemberThread,
  isMemberValid,
} = require("../utils/openai.js");

// Deleting member profile file.

module.exports =
  /**
   *
   * @param {PartialGuildMember} member
   */
  async (member) => {
    if (member.id === member.client.user.id) return;

    // if (!(await isPremium(guild))) return;

    let guild = member.guild;

    let thread = await getMemberThread(guild.id, member.user.id);

    if (thread) {
      let isValid = await isMemberValid(thread);

      if (!isValid) {
        let banCountFile = fs.readFileSync(
          __dirname.replace("events", "ban_count.txt"),
          "utf-8"
        );

        let banCount = parseInt(banCountFile);
        banCount++;

        fs.writeFileSync(
          __dirname.replace("events", "ban_count.txt"),
          banCount.toString()
        );
      }

      await openai.threads.del(thread.id);
    }
  };
