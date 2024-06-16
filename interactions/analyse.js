// Analyse slash command

const {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
  ChannelType,
  Locale,
} = require("discord.js");

const fs = require("fs");
const analyser = require("../analyser");
const { openai } = require("../openai");

const langs = require("../langs.json");

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    let sentences =
      langs[interaction.guild.preferredLocale || "en-US"] || langs["en-US"];

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

    // // Check if the user is the bot

    // if (interaction.client.user.id === user.id) {
    //   return interaction.reply({
    //     content: sentences.cannotSelf,
    //     ephemeral: true,
    //   });
    // }

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
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
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
      .setThumbnail(user.displayAvatarURL({ dynamic: true }));

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

            let message = await openai.threads.messages.create(thread.id, {
              content: sentences.askAIExplanation.replace(
                "$1",
                sentences["words"][result.toLowerCase()]
              ),
              role: "user",
            });

            let run = await openai.threads.runs.createAndPoll(thread.id, {
              assistant_id: process.env.OPENAI_ASSISTANT_ID,
            });

            if (run.status === "completed") {
              let messages = await openai.threads.messages.list(run.thread_id);
              let lastMessage = messages.data[0];

              msg.edit({
                content: lastMessage.content[0].text.value,
              });

              await openai.threads.messages.del(thread.id, message.id);
              await openai.threads.messages.del(thread.id, lastMessage.id);
            }
          } catch (error) {
            console.error(error);

            interaction.editReply({
              content: sentences.apiError,
              ephemeral: true,
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
