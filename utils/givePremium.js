const dayjs = require("dayjs");
const { collections } = require("./mongodb");
const { guildEmbed } = require("./embedFactory");
const { CronJob } = require("cron");
const { Guild, User } = require("discord.js");

let { premiumGuilds } = collections;

function generateTransactionId(len = 10) {
  let transaction_id = "";
  let characters = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < len; i++) {
    transaction_id += characters[Math.floor(Math.random() * characters.length)];
  }

  return transaction_id;
}

/**
 *
 * @param {Guild} guild
 * @param {number} start_date Dates must be UTC number
 * @param {number} end_date Dates must be UTC number
 * @param {User} user
 *
 * @returns
 */
async function givePremium(guild, start_date, end_date, user) {
  let transaction_id = generateTransactionId();

  let dayjsexpire = dayjs(end_date);

  await premiumGuilds.updateOne(
    { guild_id: guild.id },
    {
      $set: {
        guild_id: guild.id,
        createdTimestamp: start_date,
        expiresTimestamp: end_date,
        original_user_id: user.id,
        transaction_id,
      },
    },
    { upsert: true }
  );

  let expiresUnix = `<t:${dayjsexpire.unix()}:R>`;

  let owner = await guild.fetchOwner();
  let embed = guildEmbed(guild)
    .setTitle("🎉 Katua Premium Grant!")
    .setDescription(
      `${user} unlocked the Katua Premium features! Try now the \`/analyse\` command. Your premium grant will expire ${expiresUnix}.`
    )
    .setColor("Gold");

  new CronJob(
    dayjsexpire.toDate(),
    () => {},
    async () => {
      await premiumGuilds.deleteOne({
        guild_id: guild.id,
      });

      let embed = guildEmbed(guild)
        .setTitle("Katua Premium Expired")
        .setDescription(`You lost your Katua Premium Grant!`)
        .setColor("Gold");

      try {
        await owner.send({
          embeds: [embed],
        });

        let systemChannel = guild.systemChannel;

        if (systemChannel) {
          systemChannel.send({
            embeds: [embed],
          });
        }
      } catch (e) {}
    },
    true,
    "America/Los_Angeles"
  );

  try {
    let systemChannel = guild.systemChannel;

    if (systemChannel) {
      await systemChannel.send({
        embeds: [embed],
      });
    }

    await owner.send({
      embeds: [embed],
    });
  } catch (e) {}
}

module.exports = givePremium;
