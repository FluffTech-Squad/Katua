// Event when bot joins a guild

const { Guild, EmbedBuilder } = require("discord.js");
let langs = require("../utils/langs.js");
const isPremium = require("../utils/isPremium.js");
const { collections } = require("../utils/mongodb.js");

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
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL(),
      })
      .setTitle(sentences.botJoinTitle)
      .setDescription(sentences.botJoinText)
      .setColor("Green")
      .setTimestamp(Date.now())
      .setFooter({
        text: `${guild.client.user.username} ${new Date().getFullYear()} `,
        iconURL: guild.client.user.displayAvatarURL(),
      })
      .setThumbnail(guild.iconURL())
      .setImage(guild.bannerURL() || null);

    let dm = await owner.createDM();

    if (await isPremium(guild)) {
      embed.setDescription(
        embed.data.description +
          "\n" +
          sentences.premiumWhitelistJoin.replace("$1", guild.name)
      );

      console.log("Premium guild joined: ", guild.name, `(${guild.id})`);
    } else {
      console.log("Guild joined: ", guild.name, `(${guild.id})`);
    }

    try {
      await dm.send({ embeds: [embed] });
    } catch (e) {
      console.log("Can't send a message to the owner.");

      let systemChannel = guild.systemChannel;

      if (systemChannel) {
        await systemChannel.send({ embeds: [embed] });
      }
    }

    // Setup config for the guild

    await collections.guilds.insertOne({
      guild_id: guild.id,
      assistant: process.env.OPENAI_ASSISTANT_ID,
    });
    await collections.guildRules.insertOne({
      guild_id: guild.id,
      rules: {
        "nsfw-filter": true,
        "word-filter": false,
      },
    });
  };
