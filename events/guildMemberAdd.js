// guildMemberAdd event

const {
  GuildMember,
  EmbedBuilder,
  BaseGuildTextChannel,
  Collection,
} = require("discord.js");

const analyse = require("../utils/analyser");
const fs = require("fs");
const langs = require("../utils/langs");
const { openai, getMemberThread } = require("../utils/openai");
const findGuildDatas = require("../utils/findGuildDatas");

// Analysing member profile and determine if it's a troll/anti-furry or not.

module.exports =
  /**
   *
   * @param {GuildMember} member
   */
  async (member) => {
    if (member.user.bot) return;

    let botMember = member.guild.members.me;

    let guild = member.guild;
    let lang = guild.preferredLocale || "en-US";
    let sentences = langs[lang] || langs["en-US"];

    try {
      let guildData = await findGuildDatas(guild);
      let log_channel = guildData.logChannel;

      if (log_channel === null || !log_channel.isTextBased()) return;

      let joinedAt = member.joinedAt;
      let createdAt = member.user.createdAt;

      let joinedAtDay = joinedAt.getDate();
      let joinedAtMonth = joinedAt.getMonth() + 1;
      let joinedAtYear = joinedAt.getFullYear();

      let createdAtDay = createdAt.getDate();
      let createdAtMonth = createdAt.getMonth() + 1;
      let createdAtYear = createdAt.getFullYear();

      let embed = new EmbedBuilder()
        .setTitle(sentences.suspicionTitle)
        .setAuthor({
          name: member.user.username,
          iconURL: member.user.displayAvatarURL(),
        })
        .setDescription(sentences.waitReport)
        .addFields([
          {
            name: sentences.commonGuildsLabel,
            value: guilds.size.toString(),
            inline: true,
          },
          {
            name: sentences.joinedAtLabel,
            value: `${joinedAtDay}/${joinedAtMonth}/${joinedAtYear}`,
            inline: true,
          },
          {
            name: sentences.createdAtLabel,
            value: `${createdAtDay}/${createdAtMonth}/${createdAtYear}`,
            inline: true,
          },
        ])
        .setTimestamp(Date.now())
        .setFooter({
          text: `${
            interaction.client.user.username
          } ${new Date().getFullYear()} `,
          iconURL: interaction.client.user.displayAvatarURL(),
        })
        .setThumbnail(member.user.displayAvatarURL())
        .setColor("Grey")
        .setImage(member.user.bannerURL() || null);

      let message = await log_channel.send({ embeds: [embed] });

      if (!(await isPremium(message.guild))) {
        embed.setDescription(sentences.notPremiumText).setColor("Gold");

        message.edit({ embeds: [embed] });

        return;
      }

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

          /**
           * @type {Collection<string, BaseGuildTextChannel>}
           */
          let channels = (await guild.channels.fetch()).filter(
            (channel) =>
              channel.isTextBased() &&
              channel.permissionsFor(botMember).has("SendMessages")
          );

          let firstChannel = channels.first();

          let channel = guild.systemChannel || firstChannel;

          if (guildData.inform_members_channel_id) {
            let inform_channel = await guild.channels.fetch(
              guildData.inform_members_channel_id
            );

            if (inform_channel && inform_channel.isTextBased()) {
              inform_channel.send({
                content: sentences.memberReport.replace("$1", member.user),
                allowedMentions: { users: [], parse: [] },
              });
            }
          } else {
            channel.send({
              content: sentences.memberReport.replace("$1", member.user),
              allowedMentions: { users: [], parse: [] },
            });
          }
        }

        embed.setColor("Red").setTitle(sentences.invalidTitle);

        message.edit({ embeds: [embed] });

        let thread = await getMemberThread(guild.id, member.user.id);

        if (thread) {
          try {
            let explanation = await analyse.askExplanation(
              thread,
              lang,
              "invalid"
            );

            embed.setDescription(explanation);

            message.edit({
              embeds: [embed],
            });
          } catch (error) {
            console.error(error);

            embed.setDescription(sentences.apiError);
            message.edit({
              embeds: [embed],
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    } catch (error) {
      console.error(error);
    }
  };
