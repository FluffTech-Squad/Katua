const { ChatInputCommandInteraction } = require("discord.js");
const { collections } = require("../utils/mongodb");
let { guildTheme } = collections;
const { guildEmbed } = require("../utils/embedFactory");
module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    let subcommand = interaction.options.getSubcommand();

    if (subcommand === "add" || subcommand === "remove") {
      // Check if the user has the required permissions

      if (!interaction.memberPermissions.has("ManageGuild", true)) {
        let msg = await interaction.editReply(
          "> :x: You need the `MANAGE_GUILD` permission to use this command."
        );

        setTimeout(async () => {
          await msg.delete();
        }, 5000);

        return;
      }
    }

    if (subcommand === "add") {
      let opt = interaction.options.getString("theme", true);

      await guildTheme.updateOne(
        { guild_id: interaction.guildId },
        {
          $addToSet: {
            themes: opt,
          },
        },
        { upsert: true }
      );

      interaction.editReply(
        `> :white_check_mark: ${opt} theme added to the guild!`
      );
    }

    if (subcommand === "remove") {
      let opt = interaction.options.getString("theme", true);

      await guildTheme.updateOne(
        { guild_id: interaction.guildId },
        {
          $pull: {
            themes: opt,
          },
        },
        { upsert: true }
      );

      interaction.editReply(
        `> :white_check_mark: ${opt} theme removed from the guild!`
      );
    }

    if (subcommand === "list") {
      let guildThemeData = await guildTheme.findOne({
        guild_id: interaction.guildId,
      });

      if (
        guildThemeData &&
        guildThemeData.themes &&
        guildThemeData.themes.length
      ) {
        let embed = guildEmbed(interaction.guild);

        embed = embed
          .setTitle(`${interaction.guild.name} themes`)
          .setDescription(
            guildThemeData.themes.map((t) => "`" + t + "`").join(", ")
          );

        interaction.editReply({
          embeds: [embed],
        });
      } else {
        let embed = guildEmbed(interaction.guild);

        embed = embed
          .setTitle("No theme set")
          .setDescription(
            "There is no theme set, thus, default theme is `furry`"
          );

        interaction.editReply({
          embeds: [embed],
        });
      }
    }
  };
