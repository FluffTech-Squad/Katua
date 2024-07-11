const {
  ChatInputCommandInteraction,
  PermissionsBitField,
  BaseGuildTextChannel,
} = require("discord.js");

// Lock a channel. Members will not be able to send messages until unlocked.
module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    let memberPermissions = interaction.memberPermissions;

    if (!memberPermissions.has("ManageChannels")) {
      let msg = await interaction.editReply({
        content:
          "> :x: You do not have the required permissions to unlock this channel. You need `Manage Channels` permission.",
      });

      return setTimeout(() => {
        try {
          msg.delete();
        } catch {}
      }, 5000);
    }

    let botMember = await interaction.guild.members.fetch(
      interaction.client.user.id
    );

    if (!botMember.permissions.has("ManageChannels")) {
      let msg = await interaction.editReply({
        content:
          "> :x: I do not have the required permissions to unlock this channel. I need `Manage Channels` permission.",
      });

      return setTimeout(() => {
        try {
          msg.delete();
        } catch {}
      }, 5000);
    }

    let channel = interaction.channel;

    if (!(channel instanceof BaseGuildTextChannel)) return;

    channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: true,
    });

    let msg = await interaction.editReply({
      content: "> :white_check_mark: This channel has been unlocked.",
    });

    setTimeout(() => {
      msg.delete();
    }, 5000);
  };
