// Event when bot joins a guild

const { Guild } = require("discord.js");
let langs = require("../utils/langs.js");
const { collections } = require("../utils/mongodb.js");
const { guildEmbed } = require("../utils/embedFactory.js");

module.exports =
  /**
   *
   * @param {Guild} guild
   */

  async (guild) => {
    let lang = guild.preferredLocale || "en-US";
    let sentences = langs[lang] || langs["en-US"];

    try {
      let owner = await guild.fetchOwner();

      // Send a message to the owner to inform them about the bot

      let embed = guildEmbed(guild)
        .setTitle(sentences.botJoinTitle)
        .setDescription(sentences.botJoinText)
        .setColor("Green");

      let systemChannel = guild.systemChannel;

      await collections.guilds.insertOne({
        guild_id: guild.id,
        prevent_members: true,
        inform_members_channel_id: systemChannel ? systemChannel.id : null,
      });

      await collections.guildRules.insertOne({
        guild_id: guild.id,
        rules: {
          "nsfw-filter": true,
          "word-filter": true,
        },
      });

      let Payload = { embeds: [embed] };

      try {
        await owner.send(Payload);
      } catch (e) {
        console.log(
          "Can't send a message to the owner. Sending in the system channel."
        );
        try {
          if (systemChannel) await systemChannel.send(Payload);
        } catch (e) {
          console.log("Can't send a message to the system channel.");
        }
      }
    } catch (e) {
      console.log(e);
    }
  };
