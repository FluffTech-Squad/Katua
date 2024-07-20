const { SlashCommandBuilder } = require("discord.js");

module.exports = new SlashCommandBuilder()
  .setName("theme")
  .setDescription("Manage theme of the guild for the bot.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Add a theme of the guild.")
      .addStringOption((option) =>
        option
          .setName("theme")
          .setDescription("The theme to add.")
          .addChoices(
            {
              name: "Furry",
              value: "furry",
            },
            {
              name: "LGBTQ+",
              value: "lgbtq",
            },
            {
              name: "Anime",
              value: "anime",
            },
            {
              name: "Safe Place",
              value: "safe-place",
            },
            {
              name: "Semi Safe Place",
              value: "semi-safe-place",
            }
          )
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("remove")
      .setDescription("Remove a theme of the guild.")
      .addStringOption((option) =>
        option
          .setName("theme")
          .setDescription("The theme to remove.")
          .addChoices(
            {
              name: "Furry",
              value: "furry",
            },
            {
              name: "LGBTQ+",
              value: "lgbtq",
            },
            {
              name: "Anime",
              value: "anime",
            },
            {
              name: "Safe Place",
              value: "safe-place",
            }
          )
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("list").setDescription("List all themes of the guild.")
  );
