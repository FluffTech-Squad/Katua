// guildMemberAdd event

const { GuildMember } = require("discord.js");
const analyse = require("../analyser");

let langs = require("../langs.json");

// Analysing member profile and determine if it's a troll/anti-furry or not.

module.exports =
  /**
   *
   * @param {GuildMember} member
   */
  async (member) => {
    if (member.user.bot) return;

    let guild = member.guild;
    let lang = guild.preferredLocale || "en-US";

    try {
      let result = await analyse(member);
      console.log(result);
    } catch (error) {
      console.error(error);
    }
  };
