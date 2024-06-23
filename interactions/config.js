// Slash command config interaction

const {
  ChatInputCommandInteraction,
  ChannelType,
  EmbedBuilder,
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
      return interaction.reply({
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
            value: guildData?.enabled.length
              ? guildData.enabled.join(", ")
              : "None",
            inline: true,
          },
          {
            name: "Disabled",
            value: guildData?.disabled.length
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

      let detectorPromptEmbed = guildEmbed(interaction.guild).setTitle(
        "Actual Detector Prompt"
      );

      let desc =
        "Here is the current prompt for the detector. You can change it by using the `/config detector-prompt` command.\n\n";

      let assistant_id =
        guildData.assistant_id || process.env.OPENAI_ASSISTANT_ID;

      let assistant = await openai.assistants.retrieve(assistant_id);

      desc += "```" + assistant.instructions + "```";

      detectorPromptEmbed = detectorPromptEmbed.setDescription(desc);

      if (type) {
        if (type === "logging") {
          await interaction.reply({
            embeds: [guildDataEmbed],
          });
          return;
        } else if (type === "filters") {
          await interaction.reply({
            embeds: [guildRulesDataEmbed],
          });
          return;
        } else if (type === "detector-prompt") {
          await interaction.reply({
            embeds: [detectorPromptEmbed],
          });
          return;
        }

        return;
      }

      let index = 0;

      let embeds = [guildDataEmbed, guildRulesDataEmbed, detectorPromptEmbed];

      let previousButton = new ButtonBuilder()
        .setCustomId("previous")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true);

      let nextButton = new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary);

      /**
       * @type {Message | null}
       */
      let message = null;

      await interaction.deferReply();

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

        message = await interaction.editReply({
          embeds: [embeds[index]],
          components: [
            {
              type: ComponentType.ActionRow,
              components: [previousButton, nextButton],
            },
          ],
        });

        let collector = message.createMessageComponentCollector({
          filter: (i) => i.user.id === interaction.user.id,
          dispose: false,
        });

        collector.on("collect", async (i) => {
          i.deferReply();
          i.deleteReply();

          if (i.customId === "previous") {
            index--;
            await updateMessage();
          } else if (i.customId === "next") {
            index++;
            await updateMessage();
          }
        });
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
            return interaction.reply({
              content:
                "I can't view that channel. Please make sure I have the `VIEW_CHANNEL` permission in that channel.",
              ephemeral: true,
            });
          }

          if (!channel.permissionsFor(botMember).has("SendMessages")) {
            return interaction.reply({
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

          await interaction.reply({
            content: `:white_check_mark: Log channel has been set to <#${channel.id}>.`,
            ephemeral: true,
          });

          channel.send({
            content: `:white_check_mark: Log channel has been set to <#${channel.id}>.`,
          });
        }

        if (subcommand === "public-channel") {
          if (!isPremiumGuild)
            return interaction.reply(
              "This feature is only available for premium servers."
            );

          /**
           * @type {import("discord.js").TextChannel}
           */
          let channel = options.getChannel("channel", true);

          let botMember = guild.members.me;

          if (!channel.viewable) {
            return interaction.reply({
              content:
                "I can't view that channel. Please make sure I have the `VIEW_CHANNEL` permission in that channel.",
              ephemeral: true,
            });
          }

          if (!channel.permissionsFor(botMember).has("SendMessages")) {
            return interaction.reply({
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

          await interaction.reply({
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

          await interaction.reply({
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

          await interaction.reply({
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

          await interaction.reply({
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

          await interaction.reply({
            content: `:white_check_mark: ${filter} filter has been disabled.`,
            ephemeral: true,
          });
        }
        break;
    }
  };
