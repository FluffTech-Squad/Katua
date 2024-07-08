// Show config slash command register

const { SlashCommandBuilder } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("show-config")
  .setDescription("Show the current configuration.")
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("The type of configuration to show.")
      .addChoices(
        {
          name: "logging",
          value: "logging",
        },
        {
          name: "filters",
          value: "filters",
        },
        {
          name: "verification-airlock",
          value: "verification-airlock",
        },
        {
          name: "ticketing",
          value: "ticketing",
        }
      )
      .setRequired(false)
  );
