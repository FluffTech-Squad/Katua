// Event when bot joins a guild

const { Guild, EmbedBuilder } = require("discord.js");
let langs = require("../langs.json");

module.exports =
  /**
   *
   * @param {Guild} guild
   */

  async (guild) => {
    let lang = guild.preferredLocale || "en-US";
    let sentences = langs[lang] || langs["en-US"];

    let owner = await guild.fetchOwner();

    // Send a message to the owner to inform them about the bot

    let embed = new EmbedBuilder()
      .setTitle(sentences.botJoinTitle)
      .setDescription(sentences.botJoinText)
      .setColor("Green");

    let dm = await owner.createDM();

    try {
      await dm.send({ embeds: [embed] });
    } catch (e) {
      console.log("Can't send a message to the owner.");

      let systemChannel = guild.systemChannel;

      if (systemChannel) {
        await systemChannel.send({ embeds: [embed] });
      }
    }
  };
