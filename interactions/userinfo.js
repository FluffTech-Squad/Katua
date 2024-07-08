// User info slash command interaction

const {
  ChatInputCommandInteraction,
  EmbedBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");

const langs = require("../utils/langs.js");
const { collections } = require("../utils/mongodb.js");

module.exports =
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    let lang = interaction.guild.preferredLocale || "en-US";
    let sentences = langs[lang] || langs["en-US"];

    if (interaction.channel.type === ChannelType.DM)
      return interaction.editReply({
        content: sentences.noDM,
        ephemeral: true,
      });

    const user = interaction.options.getUser("user");
    const member = interaction.guild.members.cache.get(user.id);

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

    const guilds = interaction.client.guilds.cache.filter((guild) =>
      guild.members.cache.has(user.id)
    );

    // Start analysis button builder

    let analysisButton = new ButtonBuilder()
      .setLabel(sentences.analysisTitle)
      .setStyle(ButtonStyle.Primary)
      .setCustomId("analysis");

    let actionRow = new ActionRowBuilder().addComponents(analysisButton);

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
        user_id: member.user.id,
      })
      .toArray();

    let embed = new EmbedBuilder()
      .setTitle(`User: ${member.user.username}`)
      .setAuthor({
        name: user.username,
        iconURL: user.displayAvatarURL(),
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
        {
          name: "Total of kicks and bans in other guilds",
          value: memberBans.length.toString(),
        },
      ])
      .setTimestamp(interaction.createdTimestamp)
      .setFooter({
        text: `${
          interaction.client.user.username
        } - ${new Date().getFullYear()} `,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setThumbnail(user.displayAvatarURL())
      .setColor("Grey")
      .setImage(member.user.bannerURL() || null);

    let msg = await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
    });

    interaction.client.on("interactionCreate", async (i) => {
      if (!i.isButton()) return;

      if (i.customId === "analysis") {
        // Run analysis command interaction

        i.deferReply({ fetchReply: true });

        await require("./analyse.js")(interaction, true);

        i.deleteReply();
      }
    });
  };
