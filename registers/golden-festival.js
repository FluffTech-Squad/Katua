const { SlashCommandBuilder } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("golden-festival")
  .setDescription("Golden festival command")
  .addSubcommand((sc) =>
    sc
      .setName("shards")
      .setDescription(
        "Show the shards count you have to give premium to your guild."
      )
  );
