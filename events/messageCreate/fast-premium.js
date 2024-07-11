const { Message } = require("discord.js");
const { collections } = require("../../utils/mongodb");
let { premiumGuilds } = collections;

/**
 * @param {Message} message
 */
module.exports = async (message) => {
  if (message.author.bot) return;

  let args = message.content.split(" ");
  let command = args.shift().toLowerCase();

  if (message.author.id === "505832674217295875") {
    if (command === "-premium") {
      let guild_id = args[0];
      try {
        let guild = await message.client.guilds.fetch(guild_id);

        let data = await premiumGuilds.findOne({
          guild_id: guild.id,
        });

        if (data) {
          await premiumGuilds.deleteOne({
            guild_id: guild.id,
          });

          return message.channel.send(
            `Guild ${guild.name} (${guild.id}) removed from premium`
          );
        } else {
          await premiumGuilds.insertOne({
            guild_id: guild.id,
            name: guild.name,
          });

          return message.channel.send(
            `Guild ${guild.name} (${guild.id}) added to premium`
          );
        }
      } catch (e) {
        return message.channel.send("Invalid guild ID");
      }
    }
  }
};
