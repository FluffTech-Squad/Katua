// Help slash command that shows the list of commands

const { ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");

const langs = require("../langs.json");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
module.exports = (interaction) => {
  let guild = interaction.guild;

  if (!guild) return;

  let lang = guild.preferredLocale || "en-US";

  let langData = langs[lang];

  let commands = langData["helpCommands"];

  let cmds = "";

  for (let command in commands) {
    let usage = commands[command].usage
      ? `\`${commands[command].usage}\``
      : commands[command].usages.map((usage) => `\n\`${usage}\``).join("");

    cmds += `# \`${commands[command].localeName}\`\n${commands[command].description}\n
    **Usage**: ${usage}\n\n`;
  }

  let embed = new EmbedBuilder()
    .setTitle(langData["helpCommands"]["help"].description)
    .setDescription(cmds);

  interaction.reply({ embeds: [embed] });
};
