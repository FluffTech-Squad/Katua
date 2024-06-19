// Event when bot joins a guild

const { Guild, EmbedBuilder } = require("discord.js");
let langs = require("../utils/langs.js");
const fs = require("fs");
const isPremium = require("../utils/isPremium.js");

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

    // let invites = await guild.invites.fetch();

    // if (invites.size === 0) {
    //   guild.invites.create(
    //     guild.channels.cache.filter((ch) => ch.isTextBased()).first(),
    //     { maxUses: 1, unique: true, targetUser: owner, reason: "Bot join" }
    //   );
    // }

    let embed = new EmbedBuilder()
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL(),
        // url: await guild.invites.fetch().then((invites) => invites.first().url),
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

    let guildsFolder = __dirname.replace("events", "guilds");

    if (!fs.existsSync(guildsFolder)) fs.mkdirSync(guildsFolder);

    let guildFilePath = `${guildsFolder}/${guild.id}.json`;

    let guildsRulesFolder = `${guildsFolder}/rules`;

    if (!fs.existsSync(guildsRulesFolder)) fs.mkdirSync(guildsRulesFolder);

    let guildRulesFile = `${guildsRulesFolder}/${guild.id}.json`;

    fs.writeFileSync(guildFilePath, JSON.stringify({}));
    fs.writeFileSync(
      guildRulesFile,
      JSON.stringify({
        "nsfw-filter": true,
        "word-filter": false,
      })
    );
  };
