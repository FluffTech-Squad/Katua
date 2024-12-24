const {
  Interaction,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  BaseGuildTextChannel,
} = require("discord.js");
const { collections } = require("../../utils/mongodb.js");
const { userEmbed } = require("../../utils/embedFactory.js");
const dayjs = require("dayjs");
let ticketing = collections.ticketing;

module.exports =
  /**
   *
   * @param {Interaction} interaction
   */
  async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "open_ticket") {
      let ticketingData = await ticketing.findOne({
        guild_id: interaction.guild.id,
      });

      await interaction.deferReply({ ephemeral: true });

      let ticketCategory = await interaction.guild.channels.fetch(
        ticketingData.category_id
      );

      if (!ticketCategory) return interaction.deleteReply();

      let ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: ticketCategory,
      });

      ticketChannel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        {
          ViewChannel: false,
        }
      );

      ticketChannel.permissionOverwrites.edit(interaction.user, {
        ViewChannel: true,
        AttachFiles: true,
        EmbedLinks: true,
      });

      ticketChannel.permissionOverwrites.edit(interaction.guild.members.me, {
        ViewChannel: true,
        AttachFiles: true,
        EmbedLinks: true,
      });

      let embed = userEmbed(interaction.user)
        .setTitle("Ticket Created")
        .setDescription(
          `${interaction.user}, your ticket ${ticketChannel} has been created.`
        );

      await interaction.editReply({ embeds: [embed] });

      let closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Close Ticket")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒");

      let welcomeEmbed = userEmbed(interaction.user)
        .setTitle("Ticket Created")
        .setDescription(`Staff will be with you shortly!`);

      await ticketChannel.send({
        content: `${interaction.user}`,
        embeds: [welcomeEmbed],
        components: [new ActionRowBuilder().addComponents(closeButton)],
      });
    }

    if (interaction.customId === "close_ticket") {
      let ticketChannel = interaction.channel;

      await interaction.deferReply({ ephemeral: true });

      // Confirm that the user wants to close the ticket

      let embed = userEmbed(interaction.user)
        .setTitle("Close Ticket")
        .setDescription(
          "Are you sure you want to close this ticket? This action is irreversible."
        );

      let btn = new ButtonBuilder()
        .setCustomId("confirm_close_ticket")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("✅");

      let msg = await interaction.editReply({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(btn)],
      });

      let collector = msg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000,
      });

      collector.on("collect", async (buttonInteraction) => {
        await buttonInteraction.deferReply({ ephemeral: true });
        await buttonInteraction.deleteReply();

        let username = interaction.channel.name.split("-")[1];

        // await msg.delete();

        // generate a transcript of the ticket

        let messages = await ticketChannel.messages.fetch();

        let transcript = `# Ticket Transcript ${username} - ${dayjs(
          Date.now()
        ).format(`DD/MM/YYYY[ - ]HH[:]mm`)} \n\n`;

        messages.forEach((msg) => {
          if (msg.author.bot) return;

          transcript += `${msg.author.tag} - ${dayjs(
            msg.createdTimestamp
          ).format(`DD/MM/YYYY[ - ]HH[:]mm`)}: ${msg.content}\n`;
        });

        // send the transcript to the tickets log channel

        let ticketingData = await ticketing.findOne({
          guild_id: interaction.guild.id,
        });

        let logChannel = await interaction.guild.channels.fetch(
          ticketingData.logs_channel_id
        );

        if (!logChannel || !(logChannel instanceof BaseGuildTextChannel))
          return;

        await logChannel.send({
          content: `Transcript for ${username}`,
          files: [
            {
              attachment: Buffer.from(transcript),
              name: `${username}-transcript.txt`,
            },
          ],
        });

        let user = await interaction.guild.members.fetch(interaction.user.id);

        await user.send({
          content: `Transcript for ${username}`,
          files: [
            {
              attachment: Buffer.from(transcript),
              name: `${username}-transcript.txt`,
            },
          ],
        });

        await ticketChannel.delete();
      });
    }
  };
