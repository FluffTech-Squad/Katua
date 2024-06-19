// Analyse slash command

const {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
} = require("discord.js");

const analyser = require("../utils/analyser");
const { getMemberThread } = require("../utils/openai");

const langs = require("../utils/langs.js");

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    let lang = interaction.guild.preferredLocale || "en-US";
    let sentences = langs[lang] || langs["en-US"];

    if (interaction.channel.type === ChannelType.DM)
      return interaction.reply({ content: sentences.noDM, ephemeral: true });

    const user = interaction.options.getUser("user");
    const member = interaction.guild.members.cache.get(user.id);

    if (!user)
      return interaction.reply({
        content: sentences.noUserAnalyse,
        ephemeral: true,
      });

    if (!member)
      return interaction.reply({
        content: sentences.noMember,
        ephemeral: true,
      });

    // Check if the user is a bot
    if (user.bot) {
      return interaction.reply({
        content: sentences.cannotBots,
        ephemeral: true,
      });
    }

    // List the guilds the user is in where the bot is in

    const guilds = interaction.client.guilds.cache.filter((guild) =>
      guild.members.cache.has(user.id)
    );

    // Generate explanation button interaction

    let explanationButton = new ButtonBuilder()
      .setCustomId("explanation")
      .setLabel(sentences.explanationLabel)
      .setStyle(ButtonStyle.Primary);

    // Generate action row

    // Start the analysis

    explanationButton.setDisabled(true);

    let actionRow = new ActionRowBuilder().addComponents(explanationButton);

    let message = await interaction.reply({
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

    let embed = new EmbedBuilder()
      .setTitle(sentences.analysisTitle)
      .setAuthor({
        name: user.username,
        iconURL: user.displayAvatarURL(),
      })
      .setDescription(sentences.apiStart)
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
      .setTimestamp(interaction.createdTimestamp)
      .setFooter({
        text: `${
          interaction.client.user.username
        } ${new Date().getFullYear()} `,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setThumbnail(user.displayAvatarURL())
      .setColor("Grey")
      .setImage(member.user.bannerURL() || null);

    try {
      let result = await analyser(member);

      switch (result.toLowerCase()) {
        case "valid":
          embed.setColor("Green").setDescription(sentences.isValid);

          explanationButton.setDisabled(false);
          actionRow = new ActionRowBuilder().addComponents(explanationButton);

          message.edit({
            content: "",
            components: [actionRow],
            embeds: [embed],
          });

          break;

        case "neutral":
          embed.setColor("Yellow").setDescription(sentences.isNeutral);

          explanationButton.setDisabled(false);
          actionRow = new ActionRowBuilder().addComponents(explanationButton);

          message.edit({
            content: "",
            components: [actionRow],
            embeds: [embed],
          });

          break;

        case "invalid":
          embed.setColor("Red").setDescription(sentences.isInvalid);

          explanationButton.setDisabled(false);
          actionRow = new ActionRowBuilder().addComponents(explanationButton);

          message.edit({
            content: "",
            components: [actionRow],
            embeds: [embed],
          });
          break;

        default:
          embed.setColor("Grey").setDescription(sentences.apiError);

          message.edit({
            content: "",
            components: [],
            embeds: [embed],
          });
          break;
      }

      // Ask for an explanation

      interaction.client.on("interactionCreate", async (interaction) => {
        if (!interaction.isButton()) return;

        if (interaction.customId === "explanation") {
          let msg = await interaction.reply({
            content: sentences.apiStart,
          });

          try {
            let thread = await getMemberThread(interaction.guild.id, user.id);

            if (thread) {
              try {
                let expanation = await analyser.askExplanation(
                  thread,
                  lang,
                  result.toLowerCase()
                );

                msg.edit({
                  content: expanation,
                });
              } catch (error) {
                console.error(error);

                msg.edit({
                  content: sentences.apiError,
                });
              }
            }
          } catch (error) {
            console.error(error);

            msg.edit({
              content: sentences.apiError,
            });
          }
        }
      });
    } catch (error) {
      embed.setColor("Grey").setDescription(sentences.apiError);

      console.error(error);

      message.edit({
        content: "",
        components: [],
        embeds: [embed],
      });
    }
  };
