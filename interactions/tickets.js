// Ticket setup slash command

const {
  ChatInputCommandInteraction,
  ChannelSelectMenuBuilder,
  ChannelType,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  BaseGuildTextChannel,
} = require("discord.js");

const { collections } = require("../utils/mongodb.js");
const { guildEmbed } = require("../utils/embedFactory.js");
let ticketing = collections.ticketing;

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    let memberPermissions = interaction.memberPermissions;

    if (!memberPermissions.has("ManageGuild")) {
      let msg = await interaction.editReply({
        content:
          "> :x: You do not have the required permissions to setup the ticket system.",
      });

      return setTimeout(() => {
        msg.delete();
      }, 5000);
    }

    let botMember = await interaction.guild.members.fetch(
      interaction.client.user.id
    );

    if (!botMember.permissions.has("ManageChannels")) {
      let msg = await interaction.editReply({
        content:
          "> :x: I do not have the required permissions to setup the ticket system.",
      });

      return setTimeout(() => {
        msg.delete();
      }, 5000);
    }

    if (ticketing.findOne({ guild_id: interaction.guild.id })) {
      ticketing.deleteMany({ guild_id: interaction.guild.id });
    }

    // Step 1, create a category or ask user to provide one

    let channels = await interaction.guild.channels.fetch();

    let categoryId = null;
    let panelChannelId = null;
    let panelMessageId = null;
    let logsChannelId = null;

    let categoryChannels = channels.filter(
      (channel) => channel.type === ChannelType.GuildCategory
    );

    async function listenCategoryChannel() {
      let selectMenu = new StringSelectMenuBuilder()
        .setCustomId("ticket_category")
        .setPlaceholder("Select a category")
        .addOptions(
          ...categoryChannels.map((channel) => ({
            label: channel.name,
            value: channel.id,
          }))
        );

      let btn = new ButtonBuilder()
        .setCustomId("create_category")
        .setLabel("New Category")
        .setStyle(ButtonStyle.Primary);

      let row = new ActionRowBuilder().addComponents(selectMenu);
      let row2 = new ActionRowBuilder().addComponents(btn);

      let message = await interaction.editReply({
        content:
          "> Select a category for the ticket system. Or click on the button to create a new category.",
        components: [row, row2],
      });

      let channelCollector =
        interaction.channel.createMessageComponentCollector({
          componentType: ComponentType.StringSelect,
          time: 60000,
          filter: (i) => i.user.id === interaction.user.id,
        });

      channelCollector.on("collect", async (selectMenuInteraction) => {
        btnCollector.stop();

        await selectMenuInteraction.deferReply();
        await selectMenuInteraction.deleteReply();

        const category_id = selectMenuInteraction.values[0];

        categoryId = category_id;

        channelCollector.stop();

        await listenPanelChannel();
      });

      let btnCollector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: (i) => i.user.id === interaction.user.id,
      });

      btnCollector.on("collect", async (btnInteraction) => {
        channelCollector.stop();

        await btnInteraction.deferReply();
        await btnInteraction.deleteReply();

        let category = await interaction.guild.channels.create({
          name: "Tickets",
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            { id: interaction.guild.roles.everyone, deny: ["ViewChannel"] },
          ],
        });

        categoryId = category.id;

        btnCollector.stop();

        await listenPanelChannel();
      });
    }

    async function listenPanelChannel() {
      let btn = new ButtonBuilder()
        .setCustomId("create_panel")
        .setLabel("New Channel")
        .setStyle(ButtonStyle.Primary);

      let row = new ActionRowBuilder().addComponents(btn);

      let message = await interaction.editReply({
        content:
          "> Mention a channel below for the ticket panel. Or click on the button to create a new channel.",
        components: [row],
      });

      let messageCollector = interaction.channel.createMessageCollector({
        max: 1,
        maxProcessed: 1,
        time: 60000,
        filter: (i) => i.author.id === interaction.user.id,
      });

      messageCollector.on("collect", async (message) => {
        btnCollector.stop();

        let panelChannel = message.mentions.channels.first();

        if (!panelChannel) {
          messageCollector.stop();

          await listenPanelChannel();
          message.delete();
          return;
        }

        message.delete();
        panelChannelId = panelChannel.id;

        await listenLogsChannel();

        messageCollector.stop();
      });

      let btnCollector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: (i) => i.user.id === interaction.user.id,
      });

      btnCollector.on("collect", async (btnInteraction) => {
        await btnInteraction.deferReply();
        await btnInteraction.deleteReply();

        let panel = await interaction.guild.channels.create({
          name: "ticket-panel",
          type: ChannelType.GuildText,
          parent: categoryId,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone,
              allow: ["ViewChannel"],
            },
          ],
        });

        panelChannelId = panel.id;

        await listenLogsChannel();

        btnCollector.stop();
      });
    }

    async function listenLogsChannel() {
      let btn = new ButtonBuilder()
        .setCustomId("create_logs")
        .setLabel("New Channel")
        .setStyle(ButtonStyle.Primary);

      let row = new ActionRowBuilder().addComponents(btn);

      let message = await interaction.editReply({
        content:
          "> Mention a channel below for the ticket logs. Or click on the button to create a new channel.",
        components: [row],
      });

      let messageCollector = interaction.channel.createMessageCollector({
        max: 1,
        maxProcessed: 1,
        time: 60000,
        filter: (i) => i.author.id === interaction.user.id,
      });

      messageCollector.on("collect", async (message) => {
        btnCollector.stop();

        let logsChannel = message.mentions.channels.first();

        if (!logsChannel) {
          messageCollector.stop();

          await listenLogsChannel();
          message.delete();
          return;
        }

        message.delete();
        logsChannelId = logsChannel.id;

        await listenLogsChannel();

        messageCollector.stop();
      });

      let btnCollector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 60000,
        filter: (i) => i.user.id === interaction.user.id,
      });

      btnCollector.on("collect", async (btnInteraction) => {
        await btnInteraction.deferReply();
        await btnInteraction.deleteReply();

        let logs = await interaction.guild.channels.create({
          name: "ticket-logs",
          type: ChannelType.GuildText,
          parent: categoryId,
        });

        logsChannelId = logs.id;

        done = true;
        await finish();

        btnCollector.stop();
      });
    }

    async function finish() {
      let openTicketButton = new ButtonBuilder()
        .setCustomId("open_ticket")
        .setLabel("Open Ticket")
        .setStyle(ButtonStyle.Success)
        .setEmoji({ name: "📩" });

      let panelEmbed = guildEmbed(interaction.guild)
        .setTitle("Open a ticket!")
        .setDescription(
          "By clicking the button, a ticket will be opened for you."
        )
        .setFooter({
          text: `Tickets - ${interaction.guild.name}`,
          iconURL: interaction.guild.iconURL(),
        });

      let panelChannel = await interaction.guild.channels.fetch(panelChannelId);

      if (!(panelChannel instanceof BaseGuildTextChannel)) return;

      let panelMessage = await panelChannel.send({
        embeds: [panelEmbed],
        components: [new ActionRowBuilder().addComponents(openTicketButton)],
      });

      await ticketing.insertOne({
        guild_id: interaction.guild.id,
        category_id: categoryId,
        panel_channel_id: panelChannelId,
        panel_message_id: panelMessage.id,
        logs_channel_id: logsChannelId,
      });

      let msg = await interaction.editReply({
        content: "> Ticket system setup successfully.",
        components: [],
        embeds: [],
      });

      setTimeout(() => {
        msg.delete();
      }, 5000);
    }

    await listenCategoryChannel();

    // Step 2, create a channel for the ticket panel or ask user to provide one

    // Step 3, create a channel for the ticket logs or ask user to provide one
  };
