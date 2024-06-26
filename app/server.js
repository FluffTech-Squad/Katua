const { Client, GuildMember, TextChannel } = require("discord.js");
const express = require("express");
const { collections } = require("../utils/mongodb");
const { userEmbed } = require("../utils/embedFactory");
const goldShardsToTime = require("../utils/goldShardsToTime");
const app = express();
const axios = require("axios").default;

let topggRoot = "https://top.gg/api";
let topggToken = process.env.TOPGG_TOKEN;

/**
 *
 * @param {Client} discordClient
 */

async function serverHandler(discordClient) {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    res.send("Hello, World!");
  });

  app.post("/voting", async (req, res) => {
    let Authorization = req.headers.authorization;
    if (Authorization !== process.env.TOPGG_AUTHORIZATION) {
      return res.status(401).send("Unauthorized");
    }

    let { bot, user, type, query, isWeekend } = req.body;

    /* Schema:
    {
      "bot": "bot_id",
      "user": "user_id",
      "type": "upvote",
      "query": "query"
    }
    */

    let response = await axios.get(`${topggRoot}/users/${user}`, {
      headers: {
        Authorization: topggToken,
        "Content-Type": "application/json",
      },
    });

    let dbUser = await collections.users.findOne({ user_id: user });

    if (!dbUser) {
      await collections.users.insertOne({
        user_id: user,
        gold_shards: isWeekend ? 2 : 1,
      });
    } else {
      await collections.users.updateOne(
        { user_id: user },
        { $inc: { gold_shards: isWeekend ? 2 : 1 } }
      );
    }

    console.log("Received a vote.");

    /**
     * @type {GuildMember}
     */
    let member = null;
    let guilds = await discordClient.guilds.fetch();

    // Find the user in all guilds and get the member object

    for (let guild of guilds.values()) {
      let fetchedGuild = await guild.fetch();
      let memberInGuild = await fetchedGuild.members
        .fetch(user)
        .catch(() => {});
      if (memberInGuild) {
        member = memberInGuild;
        break;
      }
    }

    console.log(member);

    if (!member) return res.status(200).send("OK");

    dbUser = await collections.users.findOne({ user_id: user });
    let premiumHoursToBeAbleToGive = goldShardsToTime(dbUser.gold_shards);

    let embed = userEmbed(member.user).setDescription(
      `Thanks for voting! You received ${isWeekend ? 2 : 1} gold shard${
        isWeekend ? "s" : ""
      }.\n You now have ${dbUser.gold_shards} gold shard${
        dbUser.gold_shards > 1 ? "s" : ""
      }.`
    );

    try {
      await member.send({ embeds: [embed] });
      res.status(200).send("OK");
    } catch {
      res.status(200).send("OK");
    }

    /**
     * @type {TextChannel}
     */
    let votesChannel = await discordClient.channels.fetch(
      process.env.VOTE_CHANNEL_ID
    );
    votesChannel.send({
      content: `${member.user} voted for ${bot}!`,
      embeds: [
        userEmbed(member.user)
          .setTitle("Vote")
          .setDescription(`Thanks for voting, <@${user}>`)
          .addField(
            "Gold Shards",
            `They now have ${dbUser.gold_shards} gold shard${
              dbUser.gold_shards > 1 ? "s" : ""
            }.`
          )
          .addField(
            "Premium",
            `They can now give premium for ${premiumHoursToBeAbleToGive} hours.`
          ),
      ],
    });
  });

  app
    .listen(process.env.PORT || 1027, () => {
      console.log(`Server is running on port ${process.env.PORT || 1027}.`);
    })
    .on("error", (e) => {});
}

module.exports = serverHandler;
