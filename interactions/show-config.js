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
    const { options, guild } = interaction;

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

    let guildVerificationAirlockDataEmbed = guildEmbed(interaction.guild)
      .setTitle("Verification Airlock")
      .setDescription(`Here are the current configurations for this server.`)
      .addFields(
        {
          name: "Enabled",
          value:
            guildData.enabled &&
            guildData.enabled.includes("verification-airlock")
              ? "Yes"
              : "No",
          inline: true,
        },
        {
          name: "Airlock Channel",
          value: guildData.airlock_channel_id
            ? `<#${guildData.airlock_channel_id}>`
            : "Not set",
          inline: true,
        },
        {
          name: "Airlock Role",
          value: guildData.airlock_role_id
            ? `<@&${guildData.airlock_role_id}>`
            : "Not set",
          inline: true,
        },
        {
          name: "Other Airlock Roles",
          value:
            guildData.airlock_roles && guildData.airlock_roles.length
              ? guildData.airlock_roles.map((role) => `<@&${role}>`).join(", ")
              : "None",
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
      } else if (type === "verification-airlock") {
        await interaction.editReply({
          embeds: [guildVerificationAirlockDataEmbed],
        });
        return;
      }

      return;
    }

    let index = 0;

    let embeds = [
      guildDataEmbed,
      guildRulesDataEmbed,
      guildVerificationAirlockDataEmbed,
    ];

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

      let fetchedMessage = await interaction.editReply({
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
  };
