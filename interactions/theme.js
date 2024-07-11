const { ChatInputCommandInteraction } = require("discord.js");
const { collections } = require("../utils/mongodb");
let { guildTheme } = collections;

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async (interaction) => {
    let subcommand = interaction.options.getSubcommand();

    if (subcommand === "add" || subcommand === "remove") {
      // Check if the user has the required permissions
    }

    if (subcommand === "add") {
    }

    if (subcommand === "remove") {
    }

    if (subcommand === "list") {
    }
  };
