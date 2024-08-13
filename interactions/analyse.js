// Analyse slash command

const {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
} = require("discord.js");

const analyser = require("../utils/analyser");
const { getUserThread } = require("../utils/openai");

const langs = require("../utils/langs.js");
const { collections } = require("../utils/mongodb.js");
const { userEmbed, guildEmbed } = require("../utils/embedFactory.js");
const isPremium = require("../utils/isPremium.js");

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    let members = await interaction.guild.members.fetch();

    let lang = interaction.guild.preferredLocale || "en-US";
    let sentences = langs[lang] || langs["en-US"];

    if (interaction.channel.type === ChannelType.DM)
      return interaction.editReply({
        content: sentences.noDM,
        ephemeral: true,
      });

    const user = interaction.options.getUser("user");
    const member = members.find((member) => member.user.id === user.id);

    if (!user)
      return interaction.editReply({
        content: sentences.noUserAnalyse,
        ephemeral: true,
      });

    if (!member)
      return interaction.editReply({
        content: sentences.noMember,
        ephemeral: true,
      });

    // Check if the user is a bot
    if (user.bot) {
      return interaction.editReply({
        content: sentences.cannotBots,
        ephemeral: true,
      });
    }

    // List the guilds the user is in where the bot is in

    let guilds = await interaction.client.guilds.fetch();

    let commonGuildCounts = 0;

    for (let [, guild] of guilds) {
      let fetchedGuild = await guild.fetch();
      let members = await fetchedGuild.members.fetch();

      let guildMember = members.find((member) => member.user.id === user.id);

      if (guildMember) commonGuildCounts++;
    }

    // Generate explanation button interaction

    let explanationButton = new ButtonBuilder()
      .setCustomId("explanation")
      .setLabel(sentences.explanationLabel)
      .setStyle(ButtonStyle.Primary);

    // Generate action row

    // Start the analysis

    explanationButton.setDisabled(true);

    let actionRow = new ActionRowBuilder().addComponents(explanationButton);

    await interaction.editReply({
      content: sentences.apiStart,
      components: [actionRow],
    });

    let joinedAt = member.joinedAt;
    let createdAt = user.createdAt;

    let joinedAtDay = joinedAt.getDate();
    let joinedAtMonth = joinedAt.getMonth() + 1;
    let joinedAtYear = joinedAt.getFullYear();

    let createdAtDay = createdAt.getDate();
    let createdAtMonth = createdAt.getMonth() + 1;
    let createdAtYear = createdAt.getFullYear();

    let memberBans = await collections.bans
      .find({
        user_id: user.id,
      })
      .toArray();

    let embed = userEmbed(user)
      .setTitle(sentences.analysisTitle)
      .setDescription(sentences.apiStart)
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
          name: "Total of kicks and bans in other guilds",
          value: memberBans.length.toString(),
        },
      ])
      .setColor("Grey")
      .setImage(user.bannerURL() || null);

    let guildThemeData = await collections.guildTheme.findOne({
      guild_id: interaction.guildId,
    });

    try {
      let result = await analyser(
        member,
        guildThemeData && guildThemeData.themes && guildThemeData.themes.length
          ? guildThemeData.themes.join(", ")
          : "furry"
      );

      switch (result.toLowerCase()) {
        case "valid":
          embed = embed.setColor("Green").setDescription(sentences.isValid);
          break;

        case "neutral":
          embed = embed.setColor("Yellow").setDescription(sentences.isNeutral);

          break;

        case "invalid":
          embed = embed.setColor("Red").setDescription(sentences.isInvalid);

          break;

        default:
          embed = embed.setColor("Grey").setDescription(sentences.apiError);
          break;
      }

      if (
        result.toLowerCase() === "valid" ||
        result.toLowerCase() === "neutral" ||
        result.toLowerCase() === "invalid"
      ) {
        explanationButton = explanationButton.setDisabled(false);
        actionRow = new ActionRowBuilder().addComponents(explanationButton);

        let message = await interaction.editReply({
          content: "",
          components: [actionRow],
          embeds: [embed],
        });

        // Ask for an explanation

        let collector = message.createMessageComponentCollector({
          filter: (i) => i.user.id === interaction.user.id,
          time: 60000,
          componentType: ComponentType.Button,
        });

        collector.on("collect", async (i) => {
          await i.deferReply();

          if (i.customId === "explanation") {
            await i.editReply({
              content: sentences.apiStart,
            });

            try {
              let thread = await getUserThread(user.id);

              if (thread) {
                try {
                  let expanation = await analyser.askExplanation(
                    thread,
                    lang,
                    result.toLowerCase()
                  );

                  i.editReply({
                    content: expanation,
                  });
                } catch (error) {
                  console.error(error);

                  i.editReply({
                    content: sentences.apiError,
                  });
                }
              }
            } catch (error) {
              console.error(error);

              i.editReply({
                content: sentences.apiError,
              });
            }
          }
        });
      }
    } catch (error) {
      embed.setColor("Grey").setDescription(sentences.apiError);

      console.log(error);

      interaction.editReply({
        content: "",
        components: [],
        embeds: [embed],
      });
    }
  };
