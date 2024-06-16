// Set log channel command

const {
  ChatInputCommandInteraction,
  ChannelType,
  BaseGuildTextChannel,
} = require("discord.js");
const fs = require("fs");
const langs = require("../langs.json");

module.exports =
  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    let guild = interaction.guild;

    if (!guild) return;

    let botMember = guild.members.me;

    let lang = guild.preferredLocale || "en-US";

    let langData = langs[lang];

    let logsChannel = interaction.options.getChannel("channel", true);
    let informMembersChannel =
      interaction.options.getChannel("public-channel") || null;

    // Tell if the bot don't have the permission to send messages in the channel

    if (logsChannel.isTextBased()) {
      if (!logsChannel.permissionsFor(botMember).has("SendMessages")) {
        return interaction.reply({
          content: langData.cannotSend.replace("$1", logsChannel),
          ephemeral: true,
        });
      }
    }

    if (informMembersChannel !== null && informMembersChannel !== undefined) {
      if (informMembersChannel instanceof BaseGuildTextChannel) {
        if (
          !informMembersChannel.permissionsFor(botMember).has("SendMessages")
        ) {
          return interaction.reply({
            content: langData.cannotSend.replace("$1", informMembersChannel),
            ephemeral: true,
          });
        }
      }
    }

    let preventMembers =
      interaction.options.getString("prevent-members") || "false";

    let guildsFolder = __dirname.replace("interactions", "guilds");
    let guildFilePath = `${guildsFolder}/${guild.id}.json`;

    fs.writeFileSync(
      guildFilePath,
      JSON.stringify({
        log_channel_id: logsChannel.id,
        prevent_members: preventMembers === "true" ? true : false,
        inform_members_channel_id: informMembersChannel
          ? informMembersChannel.id
          : null,
      })
    );

    // Find for the first sendable text channel

    let channels = await guild.channels.fetch();

    channels = channels.filter(
      (channel) =>
        channel.type === ChannelType.GuildText &&
        channel.permissionsFor(botMember).has("SendMessages")
    );

    let firstChannel = channels.first();

    interaction.reply({
      content: langData.setLogsText
        .replace("$1", logsChannel)
        .replace(
          "$2",
          preventMembers === "true"
            ? langData["words"]["enabled"]
            : langData["words"]["disabled"]
        )
        .replace(
          "$3",
          informMembersChannel || guild.systemChannel || firstChannel
        ),
      ephemeral: true,
    });
  };
