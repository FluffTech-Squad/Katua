// Set log channel command

const {
  ChatInputCommandInteraction,
  ChannelType,
  BaseGuildTextChannel,
} = require("discord.js");
const langs = require("../utils/langs.js");
const { collections } = require("../utils/mongodb.js");

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

    let logsChannel = interaction.options.getChannel("channel", true, [
      ChannelType.GuildText,
    ]);

    let informMembersChannel =
      interaction.options.getChannel("public-channel", false, [
        ChannelType.GuildText,
      ]) || null;

    let preventMembers = interaction.options.getString("prevent-members");

    // Tell if the bot don't have the permission to send messages in the channel

    if (!logsChannel.permissionsFor(botMember).has("SendMessages")) {
      return interaction.reply({
        content: langData.cannotSend.replace("$1", logsChannel),
        ephemeral: true,
      });
    }

    if (informMembersChannel !== null || informMembersChannel !== undefined) {
      if (!informMembersChannel.permissionsFor(botMember).has("SendMessages")) {
        return interaction.reply({
          content: langData.cannotSend.replace("$1", informMembersChannel),
          ephemeral: true,
        });
      }
    }

    let dbGuild = await collections.guilds.findOne({ guild_id: guild.id });

    if (!dbGuild) {
      await collections.guilds.insertOne({
        guild_id: guild.id,
        log_channel_id: logsChannel.id,
        prevent_members: preventMembers === "true" ? true : false,
        inform_members_channel_id: informMembersChannel
          ? informMembersChannel.id
          : null,
      });

      dbGuild = await collections.guilds.findOne({ guild_id: guild.id });
    } else {
      await collections.guilds.updateOne(
        { guild_id: guild.id },
        {
          $set: {
            log_channel_id: logsChannel.id,
            prevent_members:
              preventMembers === null
                ? preventMembers
                : preventMembers === "true"
                ? true
                : false,
            inform_members_channel_id: informMembersChannel
              ? informMembersChannel.id
              : null,
          },
        }
      );
    }

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
