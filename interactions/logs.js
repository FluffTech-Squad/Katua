const { ChatInputCommandInteraction } = require("discord.js");

const isPremium = require("../utils/isPremium.js");
const { collections } = require("../utils/mongodb.js");
const { guildEmbed } = require("../utils/embedFactory.js");
let { guilds } = collections;

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    const { options, guild } = interaction;
    let subcommand = options.getSubcommand(true);

    let isPremiumGuild = await isPremium(guild.id);

    if (!isPremiumGuild) {
      let embed = guildEmbed(guild)
        .setTitle("Premium Required")
        .setDescription("This feature is only available for premium servers.")
        .setColor("Gold")
        .setFooter({
          text: "Upgrade to premium to unlock this feature.",
          iconURL: interaction.client.user.displayAvatarURL(),
        });

      let msg = interaction.editReply({ embeds: [embed] });

      setTimeout(() => {
        msg.delete();
      }, 5000);

      return;
    }

    if (subcommand === "log-channel") {
      /**
       * @type {import("discord.js").TextChannel}
       */
      let channel = options.getChannel("channel", true);

      let botMember = guild.members.me;

      if (!channel.viewable) {
        return interaction.editReply({
          content:
            "I can't view that channel. Please make sure I have the `VIEW_CHANNEL` permission in that channel.",
          ephemeral: true,
        });
      }

      if (!channel.permissionsFor(botMember).has("SendMessages")) {
        return interaction.editReply({
          content:
            "I can't send messages in that channel. Please make sure I have the `SEND_MESSAGES` permission in that channel.",
          ephemeral: true,
        });
      }

      await guilds.updateOne(
        { guild_id: guild.id },
        { $set: { log_channel_id: channel.id } }
      );

      await interaction.editReply({
        content: `:white_check_mark: Log channel has been set to <#${channel.id}>.`,
        ephemeral: true,
      });

      channel.send({
        content: `:white_check_mark: Log channel has been set here.`,
      });
    }

    if (subcommand === "public-channel") {
      /**
       * @type {import("discord.js").TextChannel}
       */
      let channel = options.getChannel("channel", true);

      let botMember = guild.members.me;

      if (!channel.viewable) {
        return interaction.editReply({
          content:
            "I can't view that channel. Please make sure I have the `VIEW_CHANNEL` permission in that channel.",
          ephemeral: true,
        });
      }

      if (!channel.permissionsFor(botMember).has("SendMessages")) {
        return interaction.editReply({
          content:
            "I can't send messages in that channel. Please make sure I have the `SEND_MESSAGES` permission in that channel.",
          ephemeral: true,
        });
      }

      await guilds.updateOne(
        { guild_id: guild.id },
        { $set: { inform_members_channel_id: channel.id } }
      );

      await interaction.editReply({
        content: `:white_check_mark: Members will be notified for potential trolls in <#${channel.id}>.`,
        ephemeral: true,
      });

      channel.send({
        content: `Hi! Members will be notified for potential trolls in there.`,
      });
    }

    if (subcommand === "enable") {
      let type = options.getString("type", true);

      await guilds.updateOne(
        { guild_id: guild.id },
        { $addToSet: { enabled: type } }
      );

      await interaction.editReply({
        content: `:white_check_mark: ${type} has been enabled.`,
        ephemeral: true,
      });
    }

    if (subcommand === "disable") {
      let type = options.getString("type", true);

      await guilds.updateOne(
        { guild_id: guild.id },
        { $addToSet: { disabled: type } }
      );

      await interaction.editReply({
        content: `:white_check_mark: ${type} has been disabled.`,
        ephemeral: true,
      });
    }
  };
