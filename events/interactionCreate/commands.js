// interactionCreate event

// Loading commands' functions

const fs = require("fs");
const langs = require("../../utils/langs.js");
const { Interaction } = require("discord.js");
const path = require("path");

let commands = new Map();

let commandPath = path.join(__dirname, "..", "..", "interactions");

const commandFiles = fs
  .readdirSync(commandPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`../../interactions/${file}`);
  let name = file.split(".")[0];

  if (!command) {
    console.log(`${name} command function not provided.`);
  } else {
    commands.set(name, command);
  }
}

module.exports =
  /**
   *
   * @param {Interaction} interaction
   */
  async (interaction) => {
    let lang = interaction.guild ? interaction.guild.preferredLocale : "en-US";

    if (!interaction.isCommand()) return;

    let command = commands.get(interaction.commandName);

    if (!command)
      return interaction.reply({
        content: langs[lang].interactionError,
        ephemeral: true,
      });

    try {
      console.log(
        `${interaction.user.username} (${interaction.user.id}) ran ${interaction.commandName}; Guild: ${interaction.guild.name} (${interaction.guild.id})`
      );

      await interaction.deferReply();

      await command(interaction);
    } catch (error) {
      console.error(error);

      await interaction.editReply({
        content: langs[lang].interactionError,
        ephemeral: true,
      });
    }
  };
