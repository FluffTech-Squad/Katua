const { ChatInputCommandInteraction } = require("discord.js");

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

    if (subcommand === "enable") {
      await guilds.updateOne(
        { guild_id: guild.id },
        {
          $addToSet: { enabled: "verification-airlock" },
          $pull: { disabled: "verification-airlock" },
        }
      );

      await interaction.editReply({
        content: `:white_check_mark: Verification airlock has been enabled.`,
        ephemeral: true,
      });
    }

    if (subcommand === "disable") {
      await guilds.updateOne(
        { guild_id: guild.id },
        {
          $addToSet: { disabled: "verification-airlock" },
          $pull: { enabled: "verification-airlock" },
        }
      );

      await interaction.editReply({
        content: `:white_check_mark: Verification airlock has been disabled.`,
        ephemeral: true,
      });
    }

    if (subcommand === "channel") {
      let airlockChannel = options.getChannel("channel", true, [
        ChannelType.GuildText,
      ]);

      let botMember = guild.members.me;

      if (
        !airlockChannel.viewable ||
        !airlockChannel.permissionsFor(botMember).has("SendMessages")
      ) {
        return interaction.editReply({
          content:
            "I can't view that channel or send messages. Please make sure I have the `VIEW_CHANNEL` and `SEND_MESSAGES` permission in that channel.",
          ephemeral: true,
        });
      }

      await guilds.updateOne(
        { guild_id: guild.id },
        { $set: { airlock_channel_id: airlockChannel.id } }
      );

      await interaction.editReply({
        content: `:white_check_mark: Verification airlock channel has been set to <#${airlockChannel.id}>.`,
        ephemeral: true,
      });
    }

    if (subcommand === "role") {
      let guildData = await guilds.findOne({ guild_id: guild.id });

      if (
        !guildData ||
        !guildData.enabled ||
        !guildData.enabled.includes("verification-airlock")
      ) {
        let embed = guildEmbed(interaction.guild)
          .setTitle("Verification Airlock")
          .setDescription(`:x: Verification airlock is not enabled.`)
          .addField(
            "Enable Verification Airlock",
            "You can enable verification airlock by running `/config verification-airlock enable`."
          );

        return interaction.editReply({
          ephemeral: true,
          embeds: [embed],
        });
      }

      let role = options.getRole("role", true);
      let type = options.getString("type", true);

      switch (type) {
        case "one":
          await guilds.updateOne(
            { guild_id: guild.id },
            { $set: { airlock_role_id: role.id } }
          );

          await interaction.editReply({
            content: `:white_check_mark: Verification airlock role has been set to <@&${role.id}>.`,
            ephemeral: true,
          });
          break;

        case "add":
          await guilds.updateOne(
            { guild_id: guild.id },
            {
              $addToSet: { airlock_roles: role.id },
            }
          );

          await interaction.editReply({
            content: `:white_check_mark: Added <@&${role.id}> to the verification airlock roles.`,
            ephemeral: true,
          });

          break;

        case "remove":
          await guilds.updateOne(
            { guild_id: guild.id },
            {
              $pull: { airlock_roles: role.id },
            }
          );

          await interaction.editReply({
            content: `:white_check_mark: Removed <@&${role.id}> from the verification airlock roles.`,
            ephemeral: true,
          });

          break;
      }
    }
  };
