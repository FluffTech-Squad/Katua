const { Message, ChannelType, BaseGuildTextChannel } = require("discord.js");
const { collections } = require("../../utils/mongodb");
const { guildEmbed, userEmbed } = require("../../utils/embedFactory");
const isNSFW = require("../../utils/isNSFW");
const langs = require("../../utils/langs");
const { getUserThread, isMemberValid, openai } = require("../../utils/openai");
const analyser = require("../../utils/analyser");

/**
 * @param {Message} message
 */
module.exports = async (message) => {
  if (message.author.bot) return;

  let rulesData = await collections.guildRules.findOne({
    guild_id: message.guild.id,
  });

  let guildData = await collections.guilds.findOne({
    guild_id: message.guild.id,
  });

  if (!guildData.log_channel_id) return;

  let logChannel = await message.guild.channels.fetch(guildData.log_channel_id);
  if (!logChannel) return;
  if (!(logChannel instanceof BaseGuildTextChannel)) return;

  let lang = message.guild.preferredLocale || "en-US";
  let sentences = langs[lang];

  if (rulesData && rulesData["nsfw-filter"]) {
    if (!message.channel.nsfw) {
      let isNsfw = false;
      let i = 0;
      let attachments = message.attachments;

      for (let [key, attachment] of attachments) {
        if (await isNSFW(attachment.url)) {
          i++;
          isNsfw = true;
        }
      }

      if (isNsfw) {
        let embed = userEmbed(message.author)
          .setTitle(sentences.words.messageDeleted)
          .setColor("Red")
          .setDescription(
            sentences.nsfwMessage
              .replace("$1", message.author)
              .replace("$2", message.channel)
          )
          .addFields({
            name: "NSFW Attachments",
            value: i > 1 ? `${i}` : `${i}`,
          });

        if (logChannel) logChannel.send({ embeds: [embed] });

        try {
          await message.author.send(sentences.nsfwAuthorMessage);
        } catch {}

        message.delete();
      }
    }
  }

  if (rulesData && rulesData["word-filter"]) {
    if (
      message.member.permissions.has("ManageMessages") ||
      message.member.permissions.has("ManageGuild") ||
      message.member.permissions.has("Administrator")
    )
      return;

    let lastTwoMessages = await message.channel.messages.fetch({ limit: 2 });

    await analyser(message.member);
    let thread = await getUserThread(message.author.id);

    let valid = await isMemberValid(thread);

    // detect_message_harmfulness

    let content = message.content;

    if (!content) return;
    if (valid) return;

    let bfMessage = lastTwoMessages.last();

    if (message.reference && message.reference.messageId) {
      bfMessage = await message.channel.messages.fetch(
        message.reference.messageId
      );
    }

    let c = "";

    if (bfMessage) {
      c += `Message before the suspicious user's message: "${bfMessage.content}"\n`;
    }

    c += `Suspicious user's message in the channel ${message.channel.name}: "${content}"`;

    let msg = openai.threads.messages.create(thread.id, {
      role: "user",
      content: c,
    });

    let run = await openai.threads.runs.createAndPoll(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      response_format: { type: "json_object" },
      additional_instructions: `Now, we will detect if the suspicous user's messages are safe or not. If it contains insults or it is unsafe. json:`,
      tools: [
        {
          type: "function",
          function: {
            name: "detect_message_harmfulness",
            parameters: { message: c },
          },
        },
      ],
    });

    if (run.status === "requires_action") {
      let run2 = await openai.threads.runs.submitToolOutputsAndPoll(
        thread.id,
        run.id,
        {
          tool_outputs: [
            {
              output: `{ "message": "unsafe" or "safe" }`,
              tool_call_id:
                run.required_action.submit_tool_outputs.tool_calls[0].id,
            },
          ],
        }
      );

      if (run2.status === "completed") {
        let messages = await openai.threads.messages.list(run.thread_id);
        let lastMessage = messages.data[0];

        await openai.threads.messages.del(thread.id, msg.id);
        await openai.threads.messages.del(thread.id, lastMessage.id);

        let c = lastMessage.content[0];
        if (c.type !== "text") return;

        let response = JSON.parse(c.text.value).message;

        if (response === "unsafe") {
          let embed = userEmbed(message.author)
            .setTitle(sentences.words.messageDeleted)
            .setColor("Red")
            .setDescription(
              sentences.unsafeMessage
                .replace("$1", message.author)
                .replace("$2", message.channel)
            );

          if (logChannel) logChannel.send({ embeds: [embed] });

          try {
            await message.author.send(sentences.unsafeAuthorMessage);
          } catch {}

          message.delete();
        }
      }
    }
  }
};
