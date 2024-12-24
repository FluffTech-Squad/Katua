const {
  EmbedBuilder,
  User,
  GuildMember,
  Guild,
  ClientUser,
} = require("discord.js");

/**
 *
 * @param {User | ClientUser} user
 */
let userEmbed = function (user) {
  return new EmbedBuilder()
    .setAuthor({
      name: user.username,
      iconURL: user.displayAvatarURL() || null,
    })
    .setThumbnail(user.displayAvatarURL() || null)
    .setTimestamp(Date.now())
    .setFooter({
      text: `${user.client.user.username} © 2024-${new Date().getFullYear()}`,
    })
    .setColor("Blue")
    .setImage(user.bannerURL() || null);
};

/**
 *
 * @param {Guild} guild
 * @returns
 */

let guildEmbed = function (guild) {
  let embed = new EmbedBuilder()
    .setAuthor({
      name: guild.name,
      iconURL: guild.iconURL(),
    })
    .setThumbnail(guild.iconURL())
    .setTimestamp(Date.now())
    .setFooter({
      text: `${guild.client.user.username} © 2024-${new Date().getFullYear()}`,
    })
    .setColor("Blue")
    .setImage(guild.bannerURL() || null);

  return embed;
};

async function guildEmbeds(guild) {}
/**
 *
 * @param {GuildMember} member
 */
async function guildMemberEmbeds(member) {}

module.exports = {
  userEmbed,
  guildEmbed,
  guildEmbeds,
  guildMemberEmbeds,
};
