// interactionCreate event

// Loading commands' functions

const fs = require("fs");
const langs = require("../../utils/langs.js");
const {
  Interaction,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const path = require("path");
const isPremium = require("../../utils/isPremium.js");
const {
  collections: { cmdActivities },
} = require("../../utils/mongodb.js");

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
    if (!interaction.guild) return;

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

      if (!isPremium(interaction.guild) && interaction.replied) {
        let reply = await interaction.fetchReply();
        let embeds = reply.embeds || [];
        let components = reply.components || [];

        let kofiLinkBtn = new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Donate")
          .setURL("https://ko-fi.com/nekomancer0");

        let notEnoughCreditsEmbed = new EmbedBuilder()
          .setTitle("Credits soon all spent")
          .setDescription(
            "The credits used for the AI API are about to be all spent. Wait next month or help us by donating $1, $2, or more on ko-fi!"
          )
          .setColor("Gold");

        interaction.editReply({
          embeds: [...embeds, notEnoughCreditsEmbed],
          components: [...components, new ActionRowBuilder(kofiLinkBtn)],
        });
      }

      await cmdActivities.insertOne({
        timestamp: Date.now(),
        name: interaction.commandName,
      });
    } catch (error) {
      console.error(error);

      await interaction.editReply({
        content: langs[lang].interactionError,
        ephemeral: true,
      });
    }
  };
