const { ChatInputCommandInteraction } = require("discord.js");

let langs = require("../langs.js");

module.exports =
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  (interaction, now) => {
    let lang = interaction.guild ? interaction.guild.preferredLocale : "en-US";

    interaction.reply({
      content: langs[lang].latency.replace("$1", now - Date.now()),
    });
  };
