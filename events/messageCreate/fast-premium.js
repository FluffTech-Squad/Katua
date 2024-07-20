const { Message } = require("discord.js");
const { collections } = require("../../utils/mongodb");
const { guildEmbed } = require("../../utils/embedFactory");
const dayjs = require("dayjs");
const { Job } = require("node-schedule");
const { CronJob } = require("cron");
const givePremium = require("../../utils/givePremium");

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
      let days = args[1];

      try {
        if (!guild_id || guild_id === "none") guild_id = message.guildId;

        let guild = await message.client.guilds.fetch(guild_id);

        if (!guild) {
          return message.channel.send("Invalid guild ID");
        }
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
          let dayjsexpire = dayjs(new Date()).add(1, "month");

          if (days && days !== "none")
            dayjsexpire = dayjs(new Date()).add(parseInt(days), "day");

          await givePremium(
            guild,
            Date.now(),
            dayjsexpire.toDate().valueOf(),
            message.author
          );

          return message.channel.send(
            `Guild ${guild.name} (${guild.id}) added to premium`
          );
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
};
