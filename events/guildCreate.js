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

    let invites = await guild.invites.fetch();

    if (invites.size === 0) {
      guild.invites.create(
        guild.channels.cache.filter((ch) => ch.isTextBased()).first(),
        { maxUses: 1, unique: true, targetUser: owner, reason: "Bot join" }
      );
    }

    let embed = new EmbedBuilder()
      .setAuthor({
        name: guild.name,
        iconURL: guild.iconURL(),
        url: await guild.invites.fetch().then((invites) => invites.first().url),
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
