// Event when bot joins a guild

const {
  Guild,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  Message,
  ChannelType,
  ChannelSelectMenuBuilder,
  StringSelectMenuBuilder,
} = require("discord.js");
let langs = require("../utils/langs.js");
const isPremium = require("../utils/isPremium.js");
const { collections } = require("../utils/mongodb.js");

module.exports =
  /**
   *
   * @param {Guild} guild
   */

  async (guild) => {
    let lang = guild.preferredLocale || "en-US";
    let sentences = langs[lang] || langs["en-US"];

    let owner = await guild.fetchOwner();

    // Send a message to the owner to inform them about the bot

    let embed = new EmbedBuilder()
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL(),
      })
      .setTitle(sentences.botJoinTitle)
      .setDescription(sentences.botJoinText)
      .setColor("Green")
      .setTimestamp(Date.now())
      .setFooter({
        text: `${guild.client.user.username} ${new Date().getFullYear()} `,
        iconURL: guild.client.user.displayAvatarURL(),
      })
      .setThumbnail(guild.iconURL())
      .setImage(guild.bannerURL() || null);

    let dm = await owner.createDM();

    let isPremiumGuild = await isPremium(guild);
    if (isPremiumGuild) {
      embed.setDescription(
        embed.data.description +
          "\n" +
          sentences.premiumWhitelistJoin.replace("$1", guild.name)
      );

      console.log("Premium guild joined: ", guild.name, `(${guild.id})`);
    } else {
      console.log("Guild joined: ", guild.name, `(${guild.id})`);
    }

    let systemChannel = guild.systemChannel;

    // Setup config for the guild

    await collections.guilds.insertOne({
      guild_id: guild.id,
      assistant: process.env.OPENAI_ASSISTANT_ID,
      prevent_members: isPremiumGuild ? true : false,
      inform_members_channel_id: systemChannel ? systemChannel.id : null,
    });

    await collections.guildRules.insertOne({
      guild_id: guild.id,
      rules: {
        "nsfw-filter": true,
        "word-filter": isPremiumGuild ? true : false,
      },
    });

    // Show default setup in a embed and ask if they want to change it

    let setupEmbed = new EmbedBuilder()
      .setTitle(sentences.setupTitle)
      .setDescription(sentences.words.defaultSettings)
      .setColor("Aqua")
      .addFields(
        {
          name: "NSFW Filter",
          value: sentences.words.enabled,
          inline: true,
        },
        {
          name: "Word Filter",
          value: isPremiumGuild
            ? sentences.words.enabled
            : sentences.words.disabled,
          inline: true,
        },
        {
          name: sentences.words.language,
          value: lang.toString(),
          inline: true,
        },
        {
          name: "Log Channel",
          value: "None",
          inline: true,
        },
        {
          name: "Channel of informing members",
          value: systemChannel ? `<#${systemChannel.id}>` : "None",
          inline: true,
        },
        {
          name: "Inform members?",
          value: isPremiumGuild
            ? sentences.words.enabled
            : sentences.words.disabled,
          inline: true,
        }
      )
      .setTimestamp(Date.now())
      .setFooter({
        text: `${guild.client.user.username} - ${new Date().getFullYear()} `,
        iconURL: guild.client.user.displayAvatarURL(),
      });

    let startSetupButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setLabel(sentences.setupBotConfirmLabel)
      .setCustomId("start_setup");

    let row = new ActionRowBuilder().addComponents(startSetupButton);

    let Payload = { embeds: [embed, setupEmbed], components: [row] };

    /**
     * @type {null|Message}
     */
    let msg = null;

    try {
      msg = await dm.send(Payload);
    } catch (e) {
      console.log(
        "Can't send a message to the owner. Sending in the system channel."
      );
      if (systemChannel) msg = await systemChannel.send(Payload);
    }

    if (!msg)
      return console.log(
        "Can't send a message to the owner or the system channel."
      );

    guild.client.on("interactionCreate", async (interaction) => {
      if (
        interaction.customId === "start_setup" &&
        interaction.user.id === owner.id
      ) {
        let continueButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setLabel(sentences.words.continue)
          .setCustomId("continue_setup");

        let cancelButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Danger)
          .setLabel(sentences.words.cancel)
          .setCustomId("cancel_setup");

        let row = new ActionRowBuilder().addComponents(
          continueButton,
          cancelButton
        );

        await interaction.reply({
          content:
            "Make sure I have the permission to see and send messages in the log channel.",
          components: [row],
        });
      }

      if (
        interaction.customId === "continue_setup" &&
        interaction.user.id === owner.id
      ) {
        // Find all the channels in the guild and create a select menu with them

        let channels = await guild.channels.fetch();

        let channelSelectMenu = new StringSelectMenuBuilder()
          .setCustomId("log_channel")
          .setPlaceholder("Select a channel");

        for (let [, channel] of channels) {
          if (channel.type === ChannelType.GuildText) {
            channelSelectMenu.addOptions({
              label: channel.name,
              value: channel.id,
            });
          }
        }

        await interaction.reply({
          content: "Select a channel to log messages.",
          components: [new ActionRowBuilder().addComponents(channelSelectMenu)],
          ephemeral: true,
        });
      }

      if (interaction.customId === "log_channel") {
        if (interaction.isStringSelectMenu()) {
          let channel = await guild.channels.fetch(interaction.values[0]);

          await collections.guilds.updateOne(
            { guild_id: guild.id },
            { $set: { log_channel_id: channel.id } }
          );

          await interaction.reply({
            content: `Log channel set to <#${channel.id}>.`,
            ephemeral: true,
          });
        }
      }

      if (
        interaction.customId === "cancel_setup" &&
        interaction.user.id === owner.id
      ) {
        await interaction.reply({
          content: "Setup cancelled.",
          ephemeral: true,
        });
      }
    });
  };
