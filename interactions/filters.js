const { ChatInputCommandInteraction } = require("discord.js");

const isPremium = require("../utils/isPremium.js");
const { collections } = require("../utils/mongodb.js");
const { guildEmbed } = require("../utils/embedFactory.js");
let { guildRules } = collections;

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    const { options, guild } = interaction;

    let subcommand = options.getSubcommand(true);

    let isPremiumGuild = await isPremium(guild.id);

    if (subcommand === "enable") {
      let filter = options.getString("filter", true);

      if (filter === "word-filter" && !isPremiumGuild) {
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

      await guildRules.updateOne(
        { guild_id: guild.id },
        { $set: { [filter]: true } }
      );

      await interaction.editReply({
        content: `:white_check_mark: ${filter} filter has been enabled.`,
        ephemeral: true,
      });
    }

    if (subcommand === "disable") {
      let filter = options.getString("filter", true);

      await guildRules.updateOne(
        { guild_id: guild.id },
        { $set: { [filter]: false } }
      );

      await interaction.editReply({
        content: `:white_check_mark: ${filter} filter has been disabled.`,
        ephemeral: true,
      });
    }
  };
