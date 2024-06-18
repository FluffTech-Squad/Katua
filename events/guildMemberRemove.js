// guildMemberRemove event

const {
  PartialGuildMember,
  AuditLogEvent,
  ActivityType,
} = require("discord.js");
const { openai } = require("../openai.js");
const fs = require("fs");
const isPremium = require("../isPremium.js");

// Deleting member profile file.

module.exports =
  /**
   *
   * @param {PartialGuildMember} member
   */
  async (member) => {
    if (member.id === member.client.user.id) return;

    if (!(await isPremium(guild))) return;

    let guild = member.guild;

    let threadsFile = fs.readFileSync(
      __dirname.replace("events", "threads.txt"),
      "utf-8"
    );
    let threadIds = threadsFile.split("\n");
    let thread = null;
    let messages = null;

    for (let thread_id of threadIds) {
      if (thread_id === "") break;

      let threadx = await openai.threads.retrieve(thread_id);

      if (
        threadx.metadata.guild === guild.id &&
        threadx.metadata.user === member.user.id
      ) {
        thread = threadx;
        messages = await openai.threads.messages.list(thread.id);

        await openai.threads.del(thread_id);

        let threads = threadIds.filter((id) => id !== thread_id);

        fs.writeFileSync(
          __dirname.replace("events", "threads.txt"),
          threads.join("\n")
        );
      }
    }

    if (thread && messages) {
      let ok = false;

      for (let msg of messages.data) {
        if (msg.role === "assistant") {
          if (msg.metadata === "analysis") {
            if (
              msg.content[0].text.value === "invalid" ||
              msg.content[0].text.value === "neutral"
            ) {
              if (!ok) {
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

              ok = true;
            }
          }
        }
      }
    }
  };
