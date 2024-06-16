// guildMemberAdd event

const { GuildMember, EmbedBuilder, ChannelType } = require("discord.js");
const analyse = require("../analyser");
const fs = require("fs");

let langs = require("../langs.json");
const { openai } = require("../openai");

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
    let sentences = langs[lang] || langs["en-US"];

    try {
      let guildsFolder = fs.readdirSync(__dirname.replace("events", "guilds"));
      let guildFile = guildsFolder.find((file) => file.includes(guild.id));
      let guildData = require(`../guilds/${guildFile}`);

      let log_channel_id =
        guildData && guildData.log_channel_id ? guildData.log_channel_id : null;

      if (log_channel_id === null) return;

      let log_channel = await guild.channels.fetch(log_channel_id);

      if (log_channel === null) return;

      if (!log_channel.isTextBased()) return;

      let embed = new EmbedBuilder()
        .setTitle(sentences.suspicionTitle)
        .setAuthor({
          name: member.user.username,
          iconURL: member.user.displayAvatarURL(),
        })
        .setDescription(sentences.waitReport)
        .setImage(member.user.displayAvatarURL())
        .setColor("Grey");

      let message = await log_channel.send({ embeds: [embed] });

      let result = (await analyse(member)).toLowerCase();

      if (result === "neutral") {
        embed
          .setTitle(sentences.notInvalidTitle)
          .setDescription(sentences.neutralText)
          .setColor("Yellow");

        message.edit({ embeds: [embed] });

        return;
      }

      if (result === "valid") {
        embed
          .setTitle(sentences.notInvalidTitle)
          .setDescription(sentences.validText)
          .setColor("Green");

        message.edit({ embeds: [embed] });

        return;
      }

      if (result !== "invalid") return;

      try {
        if (guildData.prevent_members) {
          // Find for the first sendable text channel

          let channels = await guild.channels.fetch();

          let botMember = await guild.members.fetch(interaction.client.user.id);

          channels = channels.filter(
            (channel) =>
              channel.type === ChannelType.GuildText &&
              channel.permissionsFor(botMember).has("SendMessages")
          );

          let firstChannel = channels.first();

          let channel = guild.systemChannel || firstChannel;

          if (guildData.inform_members_channel_id) {
            let inform_channel = await guild.channels.fetch(
              guildData.inform_members_channel_id
            );

            if (inform_channel && inform_channel.isTextBased()) {
              channel = inform_channel;
            }

            channel.send(sentences.memberReport);
          }
        }

        embed.setColor("Red").setTitle(sentences.invalidTitle);

        message.edit({ embeds: [embed] });

        let threadsFile = fs.readFileSync(
          __dirname.replace("interactions", "threads.txt"),
          "utf-8"
        );

        let threadIds = threadsFile.split("\n");

        let thread = null;

        for (let thread_id of threadIds) {
          if (thread_id === "") break;

          let threadx = await openai.threads.retrieve(thread_id);

          if (
            threadx.metadata.guild === interaction.guild.id &&
            threadx.metadata.user === user.id
          ) {
            thread = threadx;
          }
        }

        let messagex = await openai.threads.messages.create(thread.id, {
          content: sentences.askAIExplanation.replace(
            "$1",
            result.toLowerCase()
          ),
          role: "user",
        });

        let run = await openai.threads.runs.createAndPoll(thread.id, {
          assistant_id: process.env.OPENAI_ASSISTANT_ID,
        });

        if (run.status === "completed") {
          let messages = await openai.threads.messages.list(run.thread_id);
          let lastMessage = messages.data[0];

          await openai.threads.messages.del(thread.id, messagex.id);
          await openai.threads.messages.del(thread.id, lastMessage.id);

          let response = lastMessage.content[0].text;

          embed.setDescription(response);

          message.edit({
            embeds: [embed],
          });
        }
      } catch (error) {
        console.error(error);

        embed.setDescription(sentences.apiError);
        log_channel.send({
          embeds: [embed],
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
