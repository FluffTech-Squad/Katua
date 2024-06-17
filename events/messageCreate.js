// messageCreate event

const {
  EmbedBuilder,
  Message,
  ChannelType,
  Guild,
  BaseGuildTextChannel,
} = require("discord.js");
const { openai } = require("../openai");
const fs = require("fs");
const analyser = require("../analyser");
const langs = require("../langs.js");
const isPremium = require("../isPremium");
const isNSFW = require("../isNSFW");

/**
 *
 * @param {Guild} guild
 */
async function findGuildDatas(guild) {
  // Get guild rules settings

  /**
   * @type {{logChannel:BaseGuildTextChannel  | null;
   * guildRulesData: {[key:string]:boolean}
   * }}
   */
  let retObj = {
    logChannel: null,
  };

  let guildsFolder = __dirname.replace("events", "guilds");

  if (!fs.existsSync(guildsFolder)) {
    fs.mkdirSync(guildsFolder);
  }

  let guildsRulesFolder = guildsFolder + "/rules";
  let guildFilePath = guildsFolder + `/${guild.id}.json`;

  if (!fs.existsSync(guildsRulesFolder)) {
    fs.mkdirSync(guildsRulesFolder);
  }

  let guildRulesFile = guildsRulesFolder + `/${guild.id}.json`;

  if (!fs.existsSync(guildRulesFile)) {
    fs.writeFileSync(guildRulesFile, JSON.stringify({}));
  }

  if (fs.existsSync(guildFilePath)) {
    let guildData = JSON.parse(fs.readFileSync(guildFilePath, "utf-8"));

    if (guildData.log_channel_id) {
      /**
       * @type {import("discord.js").GuildTextBasedChannel}
       */
      let ch = await guild.channels.fetch(guildData.log_channel_id);

      retObj.logChannel = ch;
    }
  }

  let guildRulesData = JSON.parse(fs.readFileSync(guildRulesFile, "utf-8"));

  retObj.guildRulesData = guildRulesData;

  return retObj;
}

/**
 * @param {Message} message
 */
module.exports = async (message) => {
  if (message.author.bot) return;
  if (message.channel.type === ChannelType.DM) return;

  let { logChannel, guildRulesData: rulesData } = await findGuildDatas(
    message.guild
  );

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

  let botMember = message.guild.members.me;

  let threadsFile = __dirname.replace("events", "threads.txt");

  let thread = null;
  let valid = false;

  async function findThread() {
    let threadIds = fs.readFileSync(threadsFile, "utf-8").split("\n");

    for (let thread_id of threadIds) {
      if (thread_id === "") break;

      let threadx = await openai.threads.retrieve(thread_id);

      if (!threadx) break;

      if (
        threadx.metadata.guild === message.guild.id &&
        threadx.metadata.user === message.author.id
      ) {
        thread = threadx;

        let messages = await openai.threads.messages.list(thread.id);
        let lastMessage = messages.data[0].content[0].text;

        valid = lastMessage.value === "valid";

        break;
      }
    }
  }

  await findThread();

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
    else if (!thread) {
      await analyser(message.member);
      await findThread();
    }

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
      let lastMessage = messages.data[0].content[0].text;

      await openai.threads.messages.del(thread.id, apiMsg.id);
      await openai.threads.messages.del(thread.id, lastMessage.id);

      if (lastMessage.value === "unsafe") {
        message.delete();

        if (logChannel) logChannel.send({ embeds: [embed] });
      }
    }
  }
};
