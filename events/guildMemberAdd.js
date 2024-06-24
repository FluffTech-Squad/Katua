// guildMemberAdd event

const {
  GuildMember,
  EmbedBuilder,
  BaseGuildTextChannel,
  Collection,
} = require("discord.js");

const analyse = require("../utils/analyser");
const langs = require("../utils/langs");
const { getUserThread } = require("../utils/openai");
const { collections } = require("../utils/mongodb");
const isPremium = require("../utils/isPremium");
const { userEmbed, guildEmbed } = require("../utils/embedFactory");

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
      let dbGuild = await collections.guilds.findOne({ guild_id: guild.id });

      if (!dbGuild) return;

      if (!dbGuild.log_channel_id) return;
      let log_channel = await guild.channels.fetch(dbGuild.log_channel_id);
      if (!log_channel || !log_channel.isTextBased()) return;

      let joinedAt = member.joinedAt;
      let createdAt = member.user.createdAt;

      let joinedAtDay = joinedAt.getDate();
      let joinedAtMonth = joinedAt.getMonth() + 1;
      let joinedAtYear = joinedAt.getFullYear();

      let createdAtDay = createdAt.getDate();
      let createdAtMonth = createdAt.getMonth() + 1;
      let createdAtYear = createdAt.getFullYear();

      let memberBans = await collections.bans
        .find({
          user_id: member.user.id,
        })
        .toArray();

      let guilds = await member.client.guilds.fetch();

      let commonGuildCounts = 0;

      for (let [, guild] of guilds) {
        let fetchedGuild = await guild.fetch();

        try {
          let guildMember = await fetchedGuild.members.fetch({
            user: member.user,
            force: true,
          });

          if (guildMember) commonGuildCounts++;
        } catch (e) {}
      }

      let embed = userEmbed(member.user)
        .setTitle(sentences.suspicionTitle)
        .setDescription(sentences.waitReport)
        .addFields([
          {
            name: sentences.commonGuildsLabel,
            value: commonGuildCounts.toString(),
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
          {
            name: "Total of kicks and bans in other servers",
            value: memberBans.length.toString(),
            inline: true,
          },
        ])
        .setColor("Grey");

      try {
        let message = await log_channel.send({ embeds: [embed] });
        if (!(await isPremium(member.guild))) {
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

        if (dbGuild.prevent_members) {
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

          if (dbGuild.inform_members_channel_id) {
            let inform_channel = await guild.channels.fetch(
              dbGuild.inform_members_channel_id
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

        let thread = await getUserThread(member.user.id);

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
      } catch (e) {
        try {
          let owner = await guild.fetchOwner();
          let dmChannel = owner.dmChannel;

          if (!owner.dmChannel) {
            dmChannel = await owner.createDM();
          }

          let messages = await dmChannel.messages.fetchPinned();

          let lastMessage = messages.first();

          if (lastMessage && lastMessage.author.id === member.client.user.id) {
            return;
          }

          let embed = guildEmbed(guild)
            .setTitle(sentences.apiError)
            .setDescription(
              `I couldn't send a message in the log channel of your server ${guild.name}. Please make sure if the \`VIEW_CHANNEL\` and \`SEND_MESSAGES\` permissions are enabled for me in the log channel \`${log_channel.name}\`.`
            )
            .setColor("Red");

          if (dmChannel) {
            let msg = await dmChannel.send(embed);
            await msg.pin();

            console.log(
              `Sent log error message to ${owner.user.username}, guild: ${guild.name}`
            );
          }
        } catch (e) {
          await collections.guilds.updateOne(
            {
              guild_id: guild.id,
            },
            { $unset: { log_channel_id: 1 } }
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
