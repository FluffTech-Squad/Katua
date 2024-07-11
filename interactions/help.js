// Help slash command that shows the list of commands

const {
  ChatInputCommandInteraction,
  ApplicationCommandOptionType,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ComponentType,
  EmbedBuilder,
  ApplicationCommandOptionBase,
} = require("discord.js");

const langs = require("../utils/langs.js");
const { userEmbed } = require("../utils/embedFactory.js");

/**
 *
 * @param {ChatInputCommandInteraction} interaction
 */
module.exports = async (interaction) => {
  let guild = interaction.guild;

  if (!guild) return;

  let lang = guild.preferredLocale || "en-US";

  let langData = langs[lang];

  let metadata = require("../registers/metadata.json");
  let categories = metadata.categories;

  /**
   * @type {Object.<string, string>}
   */
  let cmdsCatkeys = metadata.commands;

  /**
   * @type {Object.<string, {name: string, value: string, inline: boolean}[]>}
   */
  let x = {};

  for (let category of categories) {
    x[category.name] = [];
  }

  let commandList = await guild.client.application.commands.fetch();

  /**
   *
   * @param {import("discord.js").ApplicationCommandChoicesOption | ApplicationCommandOptionBase} option
   */
  function parseChoices(option) {
    let choices = option.choices;
    if (!choices) return option.name;

    /**
     * @type {string[]}
     */
    let names = choices.map((c) => `"${c.name}"`);

    return names.join(" | ");
  }

  function aroundRequired(s, type = "") {
    return `<${type}${s}>`;
  }

  function aroundOptional(s, type = "") {
    return `(${type}${s})`;
  }

  /**
   *
   * @param {number} type
   */
  function getTypeText(type) {
    if (type === ApplicationCommandOptionType.Channel) {
      return "#";
    }

    if (type === ApplicationCommandOptionType.User) {
      return "@";
    }

    if (type === ApplicationCommandOptionType.Role) {
      return "@&";
    }

    return "";
  }

  // let i2 = 0;

  for (let [, command] of commandList) {
    let categoryName = cmdsCatkeys[command.name];

    // Show usages
    let options = command.options;

    let usagesText = "**Usages:**\n";

    if (options.length === 0) {
      usagesText += `\`/${command.name}\`\n`;
    } else {
      for (let option of options) {
        if (option.type === ApplicationCommandOptionType.SubcommandGroup) {
          let subcommands = option.options;

          for (let subcommand of subcommands) {
            let opts = subcommand.options || [];

            for (let opt of opts) {
              let optType = getTypeText(opt.type);

              let str = `${
                opt.required
                  ? aroundRequired(parseChoices(opt), optType)
                  : aroundOptional(parseChoices(opt), optType)
              }`;

              usagesText += `\`/${command.name} ${option.name} ${subcommand.name} ${str}\`\n`;
            }
          }
        } else if (option.type === ApplicationCommandOptionType.Subcommand) {
          let opts = option.options;

          if (!opts) {
            usagesText += `\`/${command.name} ${option.name}\`\n`;
          } else {
            for (let opt of opts) {
              let optType = getTypeText(opt.type);

              let str = `${
                opt.required
                  ? aroundRequired(parseChoices(opt), optType)
                  : aroundOptional(parseChoices(opt), optType)
              }`;

              usagesText += `\`/${command.name} ${option.name} ${str}\`\n`;
            }
          }
        } else {
          let optType = getTypeText(option.type);

          let str = `${
            option.required
              ? aroundRequired(parseChoices(option), optType)
              : aroundOptional(parseChoices(option), optType)
          }`;

          usagesText += `\`/${command.name} ${str}\`\n`;
        }
      }
    }

    // let doHaveLotOfUsages = usagesText.split("\n").length >= 2;

    x[categoryName].push({
      name: command.name,
      value: `${command.description}\n${usagesText}`,
      inline: false,
    });

    // i2 = i2 ? 0 : 1;
  }

  let embed = userEmbed(interaction.client.user)
    .setTitle(langData["helpCommands"]["help"].description)
    .setDescription("Select a category to view the commands.");

  let homeEmbed = embed;

  let selectMenu = new StringSelectMenuBuilder()
    .setCustomId("help_category_select")
    .addOptions(
      {
        label: "Home",
        value: "home",
        emoji: "🏠",
      },
      ...categories.map((category) => {
        return {
          label: category.display,
          value: category.name,
          emoji: category.emoji,
        };
      })
    );

  let row = new ActionRowBuilder().addComponents(selectMenu);

  let message = await interaction.editReply({
    embeds: [embed],
    components: [row],
  });

  /**
   * @type {{category: string, embed:EmbedBuilder}[]}
   */
  let categoryEmbeds = [];

  for (let category of categories) {
    let cmds = x[category.name];
    if (cmds.length === 0) break;

    let embed = userEmbed(interaction.client.user)
      .setTitle(category.emoji + " " + category.display)
      .addFields(...cmds);

    categoryEmbeds.push({
      category: category.name,
      embed,
    });
  }

  let collector = message.createMessageComponentCollector({
    componentType: ComponentType.StringSelect,
    filter: (i) => i.user.id === interaction.user.id,
    time: 60000,
  });

  collector.on("collect", async (i) => {
    await i.deferReply();
    await i.deleteReply();

    let category = i.values[0];

    if (category === "home") {
      await interaction.editReply({
        embeds: [homeEmbed],
        components: [row],
      });

      return;
    }

    let data = categoryEmbeds.find((c) => c.category === category);

    console.log(data);

    if (data) {
      await interaction.editReply({
        fetchReply: true,
        embeds: [data.embed],
        components: [row],
      });
    } else {
      let category = i.values[0];

      let categoryData = categories.find((c) => c.name === category);

      let title = `${categoryData.emoji} ${categoryData.display}`;

      let embed = userEmbed(interaction.client.user)
        .setTitle(title)
        .setDescription(
          "No commands found in this category. Work in progress."
        );

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    }
  });
};
