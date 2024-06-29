// Help slash command that shows the list of commands

const {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
} = require("discord.js");

const langs = require("../utils/langs.js");
const { userEmbed } = require("../utils/embedFactory.js");
const fs = require("fs");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
module.exports = async (interaction) => {
  let guild = interaction.guild;

  if (!guild) return;

  let lang = guild.preferredLocale || "en-US";

  let langData = langs[lang];

  let cmds = [];

  // Get the command list; ../registers folder

  let commandList = await guild.commands.fetch();

  function aroundRequired(s, type = "") {
    return `<${type}${s}>`;
  }

  function aroundOptional(s) {
    return `(${type}${s})`;
  }

  for (let [, command] of commandList) {
    let title = `## \`${command.name}\`\n`;
    let description = `${command.description}\n\n`;

    // Show usages
    let options = command.options;
    let usagesText = "**Usages:**\n";

    if (options.length === 0) {
      usagesText += `\`${command.name}\`\n`;
    } else {
      for (let option of options) {
        if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
          let subcommands = option.options;

          for (let subcommand of subcommands) {
            let opts = subcommand.options || [];

            for (let opt of opts) {
              if (opt.type === ApplicationCommandOptionType.Channel) {
                let name = opt.name;

                if (opt.required) {
                  usagesText += `\`/${command.name} ${option.name} ${subcommand.name} <#${name}>\`\n`;
                } else {
                  usagesText += `\`/${command.name} ${option.name} ${subcommand.name} (#${name})\`\n`;
                }
              } else {
                let name = opt.name;

                if (opt.required) {
                  usagesText += `\`/${command.name} ${option.name} ${subcommand.name} <${name}>\`\n`;
                } else {
                  usagesText += `\`/${command.name} ${option.name} ${subcommand.name} (${name})\`\n`;
                }
              }
            }
          }
        } else if (option.type === ApplicationCommandOptionType.Subcommand) {
          let opts = option.options;

          if (!opts) {
            usagesText += `\`/${command.name} ${option.name}\`\n`;
          } else {
            for (let opt of opts) {
              if (opt.type === ApplicationCommandOptionType.Channel) {
                let name = opt.name;

                if (opt.required) {
                  usagesText += `\`/${command.name} ${option.name} <#${name}>\`\n`;
                } else {
                  usagesText += `\`/${command.name} ${option.name} (#${name})\`\n`;
                }
              } else {
                let name = opt.name;

                if (opt.required) {
                  usagesText += `\`/${command.name} ${option.name} <${name}>\`\n`;
                } else {
                  usagesText += `\`/${command.name} ${option.name} (${name})\`\n`;
                }
              }
            }
          }
        } else if (option.type === ApplicationCommandOptionType.Channel) {
          usagesText += `\`/${command.name} ${
            option.required
              ? aroundRequired(option.name, "#")
              : aroundOptional(option.name, "#")
          }\`\n`;
        } else if (option.type === ApplicationCommandOptionType.User) {
          usagesText += `\`/${command.name} ${
            option.required
              ? aroundRequired(option.name, "@")
              : aroundOptional(option.name, "@")
          }\`\n`;
        } else if (option.type === ApplicationCommandOptionType.Role) {
          usagesText += `\`/${command.name} ${
            option.required
              ? aroundRequired(option.name, "@")
              : aroundOptional(option.name, "@")
          }\`\n`;
        } else if (option.type === ApplicationCommandOptionType.String) {
          usagesText += `\`/${command.name} ${
            option.required
              ? aroundRequired(option.name, "")
              : aroundOptional(option.name, "")
          }\`\n`;
        } else if (option.type === ApplicationCommandOptionType.Integer) {
          usagesText += `\`/${command.name} ${
            option.required
              ? aroundRequired(option.name, "")
              : aroundOptional(option.name, "")
          }\`\n`;
        }
      }
    }

    cmds.push(`${title}${description}${usagesText}`);
  }

  let embed = userEmbed(interaction.client.user)
    .setTitle(langData["helpCommands"]["help"].description)
    .setDescription(cmds.join("\n"));

  interaction.reply({ embeds: [embed] });
};
