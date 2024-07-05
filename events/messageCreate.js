// messageCreate event

const { openai, getUserThread, isMemberValid } = require("../utils/openai");
const analyser = require("../utils/analyser");
const langs = require("../utils/langs.js");
const isPremium = require("../utils/isPremium");
const isNSFW = require("../utils/isNSFW");
const fs = require("fs");
const { EmbedBuilder, Message, ChannelType } = require("discord.js");
const { collections } = require("../utils/mongodb.js");
const { userEmbed, guildEmbed } = require("../utils/embedFactory.js");
const { base64ToArrayBuffer } = require("../utils/getBase64ImageURL.js");
const getBase64ImageURL = require("../utils/getBase64ImageURL.js");
const path = require("path");

/**
 * @param {Message} message
 */
module.exports = async (message) => {
  if (message.author.bot) return;

  // Answer if the message is a command in DMs (if the command is not an interaction command)

  let commandList = [];

  let commandFolderPath = path.join(__dirname, "..", "interactions");

  let commandFiles = fs
    .readdirSync(commandFolderPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    commandList.push("/" + file.replace(".js", ""));
  }

  if (message.channel.type === ChannelType.DM) {
    if (commandList.includes(message.content.toLowerCase())) {
      let embed = userEmbed(message.author)
        .setTitle("Error")
        .setDescription(
          "This bot doesn't support commands in DMs. Please use this bot in a guild."
        )
        .setColor("Red");

      message.channel.send({ embeds: [embed] });

      return;
    }
  }

  let args = message.content.split(" ");
  let command = args.shift().toLowerCase();

  if (command === "$premium" && message.author.id === "505832674217295875") {
    let guild = await message.client.guilds.fetch(args[0]);
    let owner = await guild.fetchOwner();

    // DM the owner of the guild to ask if they want premium freely

    let embed = userEmbed(owner.user)
      .setTitle("Premium Request")
      .setDescription(
        "You have been selected to get premium for free. Do you want it? Reply and you will enter in contact with the developer."
      )
      .setColor("Blue");

    try {
      await owner.send({ embeds: [embed] });

      message.channel.send("The owner has been DMed.");
    } catch {
      message.channel.send("The owner of the guild has disabled DMs.");
    }

    return;
  }

  if (command === "$send" && message.author.id === "505832674217295875") {
    // send message to guild owner

    let guild = await message.client.guilds.fetch(args[0]);
    let owner = await guild.fetchOwner();

    let content = args.slice(1).join(" ");

    console.log(content);

    let embed = userEmbed(owner.user)
      .setTitle("Message")
      .setDescription(content)
      .setColor("Blue");

    try {
      await owner.send({ embeds: [embed] });

      message.channel.send("The message has been sent.");
    } catch {
      message.channel.send("The owner of the guild has disabled DMs.");
    }

    return;
  }

  if (
    command === "$check_online" &&
    message.author.id === "505832674217295875"
  ) {
    let guild = await message.client.guilds.fetch(args[0]);
    let owner = await guild.fetchOwner();

    message.channel.send(owner.presence ? owner.presence.status : "offline");

    return;
  }

  if (
    command === "$check_locale" &&
    message.author.id === "505832674217295875"
  ) {
    let guild = await message.client.guilds.fetch(args[0]);

    message.channel.send(guild.preferredLocale || "en-US");
  }

  if (
    command === "$check_owner" &&
    message.author.id === "505832674217295875"
  ) {
    let guild = await message.client.guilds.fetch(args[0]);
    let owner = await guild.fetchOwner();

    let embed = userEmbed(owner.user).setTitle("Owner");

    message.channel.send({ embeds: [embed] });
    return;
  }

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

    console.log(`${message.author.username} tried to send ${message.content}.`);
    if (supportChannelCategory.type === ChannelType.GuildCategory) {
      let userChannel = supportChannelCategory.children.cache.find(
        (ch) => ch.name === message.author.id
      );

      let embed = userEmbed(message.author)
        .setTitle("Message")
        .setDescription(message.content || "No content.");

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

        let base64files = message.attachments.map((a) =>
          getBase64ImageURL(a.url)
        );

        userChannel.send({
          embeds: [embed],
          files: (await Promise.all(base64files)).map((a) =>
            base64ToArrayBuffer(a)
          ),
        });
      } else {
        if (userChannel.isTextBased()) {
          userChannel.send({
            embeds: [embed],
            files: message.attachments.map((a) => ({
              attachment: a,
            })),
          });
        }
      }
    }
  }

  if (message.channel.type === ChannelType.DM) return;

  if (supportChannelCategory.type === ChannelType.GuildCategory) {
    let userChannel = supportChannelCategory.children.cache.find(
      (ch) => ch.name === message.author.id
    );

    if (userChannel && userChannel.id === message.channel.id) {
      let embed = userEmbed(message.author)
        .setTitle("Response")
        .setDescription(message.content);

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

  let guildData = await collections.guilds.findOne({
    guild_id: message.guild.id,
  });

  if (guildData) {
    if (
      guildData.enabled &&
      guildData.enabled.includes("verification-airlock")
    ) {
      if (guildData.airlock_channel_id) {
        let airlockChannel = await message.guild.channels.fetch(
          guildData.airlock_channel_id
        );

        if (airlockChannel && airlockChannel.isTextBased()) {
          if (message.channel.id === airlockChannel.id) {
            if (guildData.airlock_role_id) {
              if (message.author.bot) return;
              if (message.author.id === message.guild.ownerId) return;

              // Return if it is a moderator talking

              let member = await message.guild.members.fetch(message.author.id);

              if (
                member.permissions.has("ManageMessages") ||
                member.permissions.has("Administrator") ||
                member.permissions.has("ManageGuild")
              )
                return;

              let messages = await message.channel.messages.fetch({
                limit: 100,
              });

              let verifyingMessages = messages.filter(
                (m) => m.author.id === message.author.id
              );

              if (verifyingMessages.toJSON().length > 1) return;

              let verifiedRole = await message.guild.roles.fetch(
                guildData.airlock_role_id
              );

              if (verifiedRole) {
                await message.react("✅");
                await message.react("❌");

                if (guildData.katua_result_channel_id) {
                  let ch = await message.guild.channels.fetch(
                    guildData.katua_result_channel_id
                  );

                  if (ch && ch.isTextBased()) {
                    // Work in progress...

                    let embed = new EmbedBuilder()
                      .setTitle("Verification")
                      .setDescription(
                        `Please react with ✅ to verify user ${message.author} in ${message.channel}. Or react with ❌ to kick the user.`
                      )
                      .setColor("Blue");

                    let workInProgressAnalysisEmbed = new EmbedBuilder()
                      .setTitle("Verification Analysis Feature")
                      .setDescription(
                        "This feature is still in development. Please wait for the developer to finish it."
                      )
                      .setColor("Blue");

                    try {
                      ch.send({ embeds: [embed, workInProgressAnalysisEmbed] });
                    } catch {}
                  }
                }

                let collector = message.createReactionCollector();

                collector.on("collect", async (reaction, user) => {
                  if (user.bot) return;

                  let member = await message.guild.members.fetch(user.id);

                  if (
                    member.permissions.has("ManageMessages") ||
                    member.permissions.has("Administrator") ||
                    member.permissions.has("ManageGuild") ||
                    member.user.id === "505832674217295875"
                  ) {
                    let verifyingMember = await message.guild.members.fetch(
                      message.author.id
                    );

                    let messages =
                      await reaction.message.channel.messages.fetch({
                        limit: 100,
                      });

                    let verifyingMessages = messages.filter(
                      (m) => m.author.id === message.author.id
                    );

                    if (reaction.message.channel.type !== ChannelType.GuildText)
                      return;

                    if (reaction.emoji.name === "✅") {
                      verifyingMessages.forEach(async (m) => {
                        await m.delete();
                      });

                      await verifyingMember.roles.add(verifiedRole);

                      // Send embed to user that they have been verified

                      let embed = guildEmbed(message.guild)
                        .setTitle("Verification")
                        .setDescription(
                          `You have been verified in ${message.guild.name}.`
                        )
                        .setColor("Green");

                      try {
                        await verifyingMember.user.send({ embeds: [embed] });
                      } catch {}
                    }

                    if (reaction.emoji.name === "❌") {
                      verifyingMessages.forEach(async (m) => {
                        await m.delete();
                      });

                      let embed = guildEmbed(message.guild)
                        .setTitle("Verification")
                        .setDescription(
                          `You have been kicked from ${message.guild.name} because you didn't get accepted.`
                        )
                        .setColor("Red");

                      try {
                        await verifyingMember.send({ embeds: [embed] });
                      } catch {}
                    }
                  } else {
                    await reaction.users.remove(user);
                  }
                });
              }
            }
          }
        }
      }
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
  }

  if (!(await isPremium(message.guild))) return;

  /**
   *
   * @returns {Promise<import("openai/src/resources/beta/index.js").Thread>}
   */
  function findThread() {
    return new Promise(async (resolve, reject) => {
      let thr = await getUserThread(message.author.id);

      if (!thr) {
        analyser(message.member).then(async (value) => {
          resolve(await getUserThread(message.author.id));
        });

        return;
      }

      resolve(thr);
    });
  }

  // If the author is a moderator, skip, otherwise analyse the member

  if (rulesData.wordFilter && rulesData.wordFilter === true) {
    if (
      message.member.permissions.has("ManageMessages") ||
      message.member.permissions.has("ManageGuild") ||
      message.member.permissions.has("Administrator")
    )
      return;

    let lastTwoMessages = await message.channel.messages.fetch({ limit: 2 });

    let thread = await findThread();
    let valid = await isMemberValid(thread);

    let embed = userEmbed(message.author)
      .setTitle("Unsafe Message Detected")
      .setDescription(message.url)
      .setColor("Red");

    // Listen to messages and analyze them
    // Check if the message contains insults

    // OpenAI API call to the the thread having the user and guild metadata

    let content = message.content;

    if (!content) return;
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
        if (logChannel) {
          await logChannel.send({ embeds: [embed] });
        }

        await message.react("🆘");

        await message.reply({
          content: `*This message has been considered as unsafe. React to this message with 🆘: 5 reactions for non-staff, and only 1 for staff to delete.*`,
        });

        let collector = message.createReactionCollector();

        collector.on("collect", async (reaction, user) => {
          if (reaction.emoji.name === "🆘") {
            let member = await message.guild.members.fetch(user.id);

            if (member.user.bot) return;

            if (
              member.permissions.has("ManageMessages") ||
              member.permissions.has("ManageGuild") ||
              member.permissions.has("Administrator")
            ) {
              collector.stop();
              message.delete();
            } else {
              if (reaction.count > 5) {
                collector.stop();
                message.delete();
              }
            }
          }
        });

        collector.on("end", () => {
          let embed = userEmbed(message.author)
            .setTitle(sentences.words.messageDeleted)
            .setDescription(
              sentences.userSaid
                .replace("$1", message.author.username)
                .replace("$2", message.channel)
                .replace("$3", message.content)
            )
            .setColor("Red");

          if (logChannel) {
            logChannel.send({ embeds: [embed] });
          }
        });
      }
    }
  }
};
