// guildMemberRemove event

const { PartialGuildMember } = require("discord.js");
const {
  openai,
  getMemberThread,
  isMemberValid,
} = require("../utils/openai.js");
const { collections } = require("../utils/mongodb.js");

// Deleting member profile file.

module.exports =
  /**
   *
   * @param {PartialGuildMember} member
   */
  async (member) => {
    if (member.id === member.client.user.id) return;

    let guild = member.guild;

    let thread = await getMemberThread(guild.id, member.user.id);

    if (thread) {
      if (!(await isMemberValid(thread))) {
        collections.bans.insertOne({
          user_id: member.user.id,
          guild_id: member.guild.id,
        });
      }

      await openai.threads.del(thread.id);
    }
  };
