// guildMemberRemove event

const { PartialGuildMember } = require("discord.js");
const { openai } = require("../openai.js");
const fs = require("fs");

// Deleting member profile file.

module.exports =
  /**
   *
   * @param {PartialGuildMember} member
   */
  async (member) => {
    let guild = member.guild;

    let threadsFile = fs.readFileSync(
      __dirname.replace("events", "threads.txt"),
      "utf-8"
    );
    let threadIds = threadsFile.split("\n");

    for (let thread_id of threadIds) {
      if (thread_id === "") break;

      let threadx = await openai.threads.retrieve(thread_id);

      if (
        threadx.metadata.guild === guild.id &&
        threadx.metadata.user === member.user.id
      ) {
        await openai.threads.del(thread_id);

        let threads = threadIds.filter((id) => id !== thread_id);

        fs.writeFileSync(
          __dirname.replace("events", "threads.txt"),
          threads.join("\n")
        );
      }
    }
  };
