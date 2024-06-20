// messageCreate event

const {
  openai,
  getThreadList,
  getMemberThread,
  isMemberValid,
} = require("../utils/openai");
const analyser = require("../utils/analyser");
const langs = require("../utils/langs.js");
const isPremium = require("../utils/isPremium");
const isNSFW = require("../utils/isNSFW");

const { EmbedBuilder, Message, ChannelType } = require("discord.js");
const { collections } = require("../utils/mongodb.js");

/**
 * @param {Message} message
 */
module.exports = async (message) => {
  if (message.author.bot) return;

  let supportGuildId = process.env.SUPPORT_GUILD_ID;
  let supportChannelId = process.env.SUPPORT_CHANNEL_ID;

  let supportGuild = await message.client.guilds.fetch(supportGuildId);
  let supportChannelCategory = await supportGuild.channels.fetch(
    supportChannelId
  );

  let supportLogChannelId = process.env.SUPPORT_LOG_CHANNEL_ID;
  let supportLogChannel = await supportGuild.channels.fetch(
    supportLogChannelId
  );

  let supportGuildOwner = await supportGuild.fetchOwner();

  if (message.channel.type === ChannelType.DM) {
    // This is for users to ask for support or premium feature request

    if (supportChannelCategory.type === ChannelType.GuildCategory) {
      let userChannel = supportChannelCategory.children.cache.find(
        (ch) => ch.name === message.author.id
      );

      let embed = new EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTitle("Message")
        .setDescription(message.content)
        .setColor("Blue");

      if (!userChannel) {
        let embedFirstTime = new EmbedBuilder()
          .setAuthor({
            name: supportGuildOwner.user.username,
            iconURL: supportGuildOwner.user.displayAvatarURL(),
          })
          .setTitle("Support Ticket")
          .setDescription("Please wait for a staff member to assist you.")
          .setColor("Blue");

        message.channel.send({ embeds: [embedFirstTime] });

        userChannel = await supportChannelCategory.children.create({
          name: message.author.id,
          type: ChannelType.GuildText,
        });

        supportLogChannel.send(
          `${supportGuildOwner.user}, ${message.author} initiated a support ticket. ${userChannel} was created.`
        );

        userChannel.send({
          embeds: [embed],
          files: message.attachments.map((a) => ({
            attachment: a,
          })),
        });
      } else {
        userChannel.send({
          embeds: [embed],
          files: message.attachments.map((a) => ({
            attachment: a,
          })),
        });
      }
    }
  }

  if (message.channel.type === ChannelType.DM) return;

  if (supportChannelCategory.type === ChannelType.GuildCategory) {
    let userChannel = supportChannelCategory.children.cache.find(
      (ch) => ch.name === message.author.id
    );

    if (userChannel && userChannel.id === message.channel.id) {
      let embed = new EmbedBuilder()
        .setAuthor({
          name: message.author.username,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTitle("Response")
        .setDescription(message.content)
        .setColor("Blue");

      let userNeedingHelp = await message.client.users.fetch(userChannel.name);

      userNeedingHelp.send({
        embeds: [embed],
        files: message.attachments.map((a) => ({
          attachment: a,
        })),
      });

      return;
    }
  }

  let rulesData = await collections.guildRules.findOne({
    guild_id: message.guild.id,
  });

  if (!rulesData) {
    await collections.guildRules.insertOne({
      guild_id: message.guild.id,
      nsfwFilter: true,
      wordFilter: false,
    });

    rulesData = await collections.guildRules.findOne({
      guild_id: message.guild.id,
    });
  }

  let lang = message.guild.preferredLocale || "en-US";
  let sentences = langs[lang];

  if (rulesData.nsfwFilter && rulesData.nsfwFilter === true) {
    if (message.channel.type === ChannelType.GuildText) {
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
          let embed = new EmbedBuilder()
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
  }

  if (!(await isPremium(message.guild))) return;

  let lastTwoMessages = await message.channel.messages.fetch({ limit: 2 });

  let thread = null;
  let valid = false;

  /**
   *
   * @returns {Promise<import("openai/resources/beta/threads/threads.mjs").Thread>}
   */
  async function findThread() {
    let thr = await getMemberThread(message.guild.id, message.author.id);

    if (!thr) {
      await analyser(message.member);
      thr = await getMemberThread(message.guild.id, message.author.id);
    }

    return thr;
  }

  thread = await findThread();
  valid = await isMemberValid(thread);

  let embed = new EmbedBuilder()
    .setTitle(sentences.words.messageDeleted)
    .setDescription(
      sentences.userSaid
        .replace("$1", message.author.username)
        .replace("$2", message.channel)
        .replace("$3", message.content)
    )
    .setColor(valid ? "Green" : "Red");

  // If the author is a moderator, skip, otherwise analyse the member

  if (rulesData.wordFilter && rulesData.wordFilter === true) {
    if (
      message.member.permissions.has("ManageMessages") ||
      message.member.permissions.has("ManageGuild") ||
      message.member.permissions.has("Administrator")
    )
      return;

    // Listen to messages and analyze them
    // Check if the message contains insults

    // OpenAI API call to the the thread having the user and guild metadata

    let content = message.content;

    if (!content) return;

    // Find if the user was validated as "neutral" or "invalid" by the AI

    if (valid) return;

    // Get the message before the author's message or get the replied message

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

    let apiMsg = await openai.threads.messages.create(thread.id, {
      content: c,
      role: "user",
    });

    let run = await openai.threads.runs.createAndPoll(thread.id, {
      assistant_id: process.env.OPENAI_ASSISTANT_ID,
      additional_instructions: `Now, we will detect if the suspicous user's messages are safe or not. If it contains insults or it is unsafe, reply with "unsafe", otherwise, reply with "skip".`,
    });

    if (run.status === "completed") {
      let messages = await openai.threads.messages.list(run.thread_id);
      let lastMessage = messages.data[0];

      await openai.threads.messages.del(thread.id, apiMsg.id);
      await openai.threads.messages.del(thread.id, lastMessage.id);

      if (lastMessage.content[0].text.value === "unsafe") {
        message.delete();

        if (logChannel) logChannel.send({ embeds: [embed] });
      }
    }
  }
};
