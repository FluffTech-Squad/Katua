const { ChatInputCommandInteraction } = require("discord.js");

const { collections } = require("../utils/mongodb.js");
let { guildRules } = collections;

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    const { options, guild } = interaction;

    let subcommand = options.getSubcommand(true);

    if (subcommand === "enable") {
      let filter = options.getString("filter", true);

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
