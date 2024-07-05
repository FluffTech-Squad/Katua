// Slash command config interaction

const {
  ChatInputCommandInteraction,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  Message,
} = require("discord.js");

const isPremium = require("../utils/isPremium.js");
const { collections } = require("../utils/mongodb.js");
const langs = require("../utils/langs.js");
const { guildEmbed } = require("../utils/embedFactory.js");
const { openai } = require("../utils/openai.js");
let { guilds, guildRules } = collections;

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    if (interaction.channel.type !== ChannelType.GuildText)
      return interaction.editReply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });

    const { options, guild } = interaction;

    let isPremiumGuild = await isPremium(guild);
    let group = options.getSubcommandGroup();
    let subcommand = options.getSubcommand(true);

    if (subcommand === "show") {
      let type = options.getString("type");

      let guildData = await guilds.findOne({ guild_id: guild.id });
      let guildRulesData = await guildRules.findOne({ guild_id: guild.id });

      let guildDataEmbed = guildEmbed(interaction.guild)
        .setTitle("Config")
        .setDescription(`Here are the current configurations for this server.`)
        .addFields(
          {
            name: "Log Channel",
            value: guildData?.log_channel_id
              ? `<#${guildData.log_channel_id}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Public Channel",
            value: guildData?.inform_members_channel_id
              ? `<#${guildData.inform_members_channel_id}>`
              : "Not set",
            inline: true,
          },
          {
            name: "Enabled",
            value:
              guildData.enabled && guildData.enabled.length
                ? guildData.enabled.join(", ")
                : "None",
            inline: true,
          },
          {
            name: "Disabled",
            value:
              guildData.disabled && guildData.disabled.length
                ? guildData.disabled.join(", ")
                : "None",
            inline: true,
          }
        );

      let guildRulesDataEmbed = guildEmbed(interaction.guild)
        .setTitle("Filters")
        .setDescription(`Here are the current filters for this server.`)
        .addFields(
          {
            name: "Profanity",
            value: guildRulesData["word-filter"] ? "Enabled" : "Disabled",
            inline: true,
          },
          {
            name: "NSFW",
            value: guildRulesData["nsfw-filter"] ? "Enabled" : "Disabled",
            inline: true,
          }
        );

      if (type) {
        if (type === "logging") {
          await interaction.editReply({
            embeds: [guildDataEmbed],
          });
          return;
        } else if (type === "filters") {
          await interaction.editReply({
            embeds: [guildRulesDataEmbed],
          });
          return;
        }

        return;
      }

      let index = 0;

      let embeds = [guildDataEmbed, guildRulesDataEmbed];

      let previousButton = new ButtonBuilder()
        .setCustomId("previous")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true);

      let nextButton = new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary);

      let updateMessage = async () => {
        previousButton = previousButton.setDisabled(index === 0);

        if (index > 0 && embeds[index - 1]) {
          previousButton = previousButton.setLabel(
            embeds[index - 1].data.title || "Previous"
          );
        }

        nextButton = nextButton.setDisabled(index === embeds.length - 1);

        if (index < embeds.length - 1 && embeds[index + 1]) {
          nextButton = nextButton.setLabel(
            embeds[index + 1].data.title || "Next"
          );
        }

        let fetchedMessage = await interaction.fetchReply();

        await fetchedMessage.edit({
          embeds: [embeds[index]],
          components: [
            {
              type: ComponentType.ActionRow,
              components: [previousButton, nextButton],
            },
          ],
        });

        let collector = fetchedMessage.createMessageComponentCollector({
          filter: (i) => i.user.id === fetchedMessage.interaction.user.id,
          componentType: ComponentType.Button,
          time: 60000 * 3,
        });

        collector.on("collect", async (i) => {
          try {
            let msg = await i.deferReply({
              ephemeral: true,
            });
            await msg.delete();

            if (i.customId === "previous") {
              if (index > 0) {
                index--;
                await updateMessage();
              }
            } else if (i.customId === "next") {
              if (index < embeds.length - 1) {
                index++;
                await updateMessage();
              }
            }
          } catch (e) {}
        });

        collector.on("end", async () => {});
        collector.on("ignore", async () => {});
      };

      await updateMessage();
    }

    if (!group) return;

    switch (group) {
      case "logs":
        if (subcommand === "log-channel") {
          /**
           * @type {import("discord.js").TextChannel}
           */
          let channel = options.getChannel("channel", true);

          let botMember = guild.members.me;

          if (!channel.viewable) {
            return interaction.editReply({
              content:
                "I can't view that channel. Please make sure I have the `VIEW_CHANNEL` permission in that channel.",
              ephemeral: true,
            });
          }

          if (!channel.permissionsFor(botMember).has("SendMessages")) {
            return interaction.editReply({
              content:
                "I can't send messages in that channel. Please make sure I have the `SEND_MESSAGES` permission in that channel.",
              ephemeral: true,
            });
          }

          let guildData = await guilds.findOne({ guild_id: guild.id });

          if (!guildData) {
            await guilds.insertOne({
              guild_id: guild.id,
              log_channel_id: channel.id,
              inform_members_channel_id: null,
              disabled: [],
              enabled: [],
            });
          } else {
            await guilds.updateOne(
              { guild_id: guild.id },
              { $set: { log_channel_id: channel.id } }
            );
          }

          await interaction.editReply({
            content: `:white_check_mark: Log channel has been set to <#${channel.id}>.`,
            ephemeral: true,
          });

          channel.send({
            content: `:white_check_mark: Log channel has been set to <#${channel.id}>.`,
          });
        }

        if (subcommand === "public-channel") {
          if (!isPremiumGuild)
            return interaction.editReply(
              "This feature is only available for premium servers."
            );

          /**
           * @type {import("discord.js").TextChannel}
           */
          let channel = options.getChannel("channel", true);

          let botMember = guild.members.me;

          if (!channel.viewable) {
            return interaction.editReply({
              content:
                "I can't view that channel. Please make sure I have the `VIEW_CHANNEL` permission in that channel.",
              ephemeral: true,
            });
          }

          if (!channel.permissionsFor(botMember).has("SendMessages")) {
            return interaction.editReply({
              content:
                "I can't send messages in that channel. Please make sure I have the `SEND_MESSAGES` permission in that channel.",
              ephemeral: true,
            });
          }

          let guildData = await guilds.findOne({ guildId: guild.id });

          if (!guildData) {
            await guilds.insertOne({
              guild_id: guild.id,
              log_channel_id: null,
              inform_members_channel_id: channel.id,
              disabled: [],
              enabled: [],
            });
          } else {
            await guilds.updateOne(
              { guild_id: guild.id },
              { $set: { inform_members_channel_id: channel.id } }
            );
          }

          await interaction.editReply({
            content: `:white_check_mark: Members will be notified for potential trolls in <#${channel.id}>.`,
            ephemeral: true,
          });

          channel.send({
            content: `Hi! Members will be notified for potential trolls in there.`,
          });
        }

        if (subcommand === "enable") {
          let type = options.getString("type", true);

          let guildData = await guilds.findOne({ guild_id: guild.id });

          if (!guildData) {
            await guilds.insertOne({
              guild_id: guild.id,
              log_channel_id: null,
              inform_members_channel_id: null,
              disabled: [],
              enabled: [type],
            });
          } else {
            await guilds.updateOne(
              { guild_id: guild.id },
              { $addToSet: { enabled: type } }
            );
          }

          await interaction.editReply({
            content: `:white_check_mark: ${type} has been enabled.`,
            ephemeral: true,
          });
        }

        if (subcommand === "disable") {
          let type = options.getString("type", true);

          let guildData = await guilds.findOne({ guild_id: guild.id });

          if (!guildData) {
            await guilds.insertOne({
              guild_id: guild.id,
              log_channel_id: null,
              inform_members_channel_id: null,
              disabled: [type],
              enabled: [],
            });
          } else {
            await guilds.updateOne(
              { guild_id: guild.id },
              { $addToSet: { disabled: type } }
            );
          }

          await interaction.editReply({
            content: `:white_check_mark: ${type} has been disabled.`,
            ephemeral: true,
          });
        }

        break;

      case "filters":
        if (subcommand === "enable") {
          let filter = options.getString("filter", true);

          let guildData = await guildRules.findOne({ guild_id: guild.id });

          if (!guildData) {
            await guildRules.insertOne({
              guild_id: guild.id,
              [filter]: true,
            });
          } else {
            await guildRules.updateOne(
              { guild_id: guild.id },
              { $set: { [filter]: true } }
            );
          }

          await interaction.editReply({
            content: `:white_check_mark: ${filter} filter has been enabled.`,
            ephemeral: true,
          });
        }

        if (subcommand === "disable") {
          let filter = options.getString("filter", true);

          let guildData = await guildRules.findOne({ guild_id: guild.id });

          if (!guildData) {
            await guildRules.insertOne({
              guild_id: guild.id,
              [filter]: false,
            });
          } else {
            await guildRules.updateOne(
              { guild_id: guild.id },
              { $set: { [filter]: false } }
            );
          }

          await interaction.editReply({
            content: `:white_check_mark: ${filter} filter has been disabled.`,
            ephemeral: true,
          });
        }
        break;

      case "verification-airlock":
        if (subcommand === "enable") {
          let guildData = await guilds.findOne({ guild_id: guild.id });

          if (!guildData) {
            await guilds.insertOne({
              guild_id: guild.id,
              log_channel_id: null,
              inform_members_channel_id: null,
              disabled: [],
              enabled: ["verification-airlock"],
            });
          } else {
            await guilds.updateOne(
              { guild_id: guild.id },
              { $addToSet: { enabled: "verification-airlock" } }
            );
          }

          await interaction.editReply({
            content: `:white_check_mark: Verification airlock has been enabled.`,
            ephemeral: true,
          });
        }

        if (subcommand === "disable") {
          let guildData = await guilds.findOne({ guild_id: guild.id });

          if (!guildData) {
            await guilds.insertOne({
              guild_id: guild.id,
              log_channel_id: null,
              inform_members_channel_id: null,
              disabled: ["verification-airlock"],
              enabled: [],
            });
          } else {
            await guilds.updateOne(
              { guild_id: guild.id },
              { $addToSet: { disabled: "verification-airlock" } }
            );
          }

          await interaction.editReply({
            content: `:white_check_mark: Verification airlock has been disabled.`,
            ephemeral: true,
          });
        }

        if (subcommand === "set") {
          let airlockChannel = options.getChannel("channel", true, [
            ChannelType.GuildText,
          ]);

          if (!airlockChannel.viewable) {
            return interaction.editReply({
              content:
                "I can't view that channel. Please make sure I have the `VIEW_CHANNEL` permission in that channel.",
              ephemeral: true,
            });
          }

          let role = options.getRole("role", true);

          let botMember = guild.members.me;

          if (!botMember.permissions.has("ManageRoles")) {
            return interaction.editReply({
              content:
                "I can't manage roles. Please make sure I have the `MANAGE_ROLES` permission in this server.",
              ephemeral: true,
            });
          }

          let katuaResultChannel = options.getChannel(
            "katua-result-channel",
            false,
            [ChannelType.GuildText]
          );

          let guildData = await guilds.findOne({ guild_id: guild.id });

          if (!guildData) {
            await guilds.insertOne({
              guild_id: guild.id,
              log_channel_id: null,
              inform_members_channel_id: null,
              airlock_channel_id: airlockChannel.id,
              katua_result_channel_id: katuaResultChannel
                ? katuaResultChannel.id
                : null,
              airlock_role_id: role.id,
              disabled: [],
              enabled: ["verification-airlock"],
            });
          } else {
            await guilds.updateOne(
              { guild_id: guild.id },
              {
                $addToSet: { enabled: "verification-airlock" },
                $set: {
                  airlock_channel_id: airlockChannel.id,
                  katua_result_channel_id: katuaResultChannel
                    ? katuaResultChannel.id
                    : null,
                  airlock_role_id: role.id,
                },
              }
            );
          }

          await interaction.editReply({
            content: `:white_check_mark: Verification airlock has been set to <#${airlockChannel.id}>.`,
            ephemeral: true,
          });
        }
        break;
    }
  };
