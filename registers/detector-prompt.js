// Slash command builder for the detector-prompt.js file

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = new SlashCommandBuilder()
  .setName("detector-prompt")
  .setDescription(
    "Manage the detector prompt to detect unsafe contents in the server."
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("set").setDescription("Set the detector prompt.")
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("reset").setDescription("Reset the detector prompt.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("show")
      .setDescription("Show the prompt of the troll detector.")
  );
