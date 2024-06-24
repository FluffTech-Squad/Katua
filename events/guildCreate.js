// Event when bot joins a guild

const { Guild, ActionRowBuilder } = require("discord.js");
let langs = require("../utils/langs.js");
const isPremium = require("../utils/isPremium.js");
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

    let owner = await guild.fetchOwner();

    // Send a message to the owner to inform them about the bot

    let embed = guildEmbed(guild)
      .setTitle(sentences.botJoinTitle)
      .setDescription(sentences.botJoinText)
      .setColor("Green");

    let dm = await owner.createDM();

    let isPremiumGuild = await isPremium(guild);
    if (isPremiumGuild) {
      embed.setDescription(
        embed.data.description +
          "\n" +
          sentences.premiumWhitelistJoin.replace("$1", guild.name)
      );

      console.log("Premium guild joined: ", guild.name, `(${guild.id})`);
    } else {
      console.log("Guild joined: ", guild.name, `(${guild.id})`);
    }

    let systemChannel = guild.systemChannel;

    // Setup config for the guild

    await collections.guilds.insertOne({
      guild_id: guild.id,
      assistant: process.env.OPENAI_ASSISTANT_ID,
      prevent_members: isPremiumGuild ? true : false,
      inform_members_channel_id: systemChannel ? systemChannel.id : null,
    });

    await collections.guildRules.insertOne({
      guild_id: guild.id,
      rules: {
        "nsfw-filter": true,
        "word-filter": isPremiumGuild ? true : false,
      },
    });

    let row = new ActionRowBuilder().addComponents(startSetupButton);

    let Payload = { embeds: [embed], components: [row] };

    try {
      await dm.send(Payload);
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
  };
