const fs = require("fs");
let socket = require("../utils/socket.js");

const {
  Routes,
  Client,
  ActivityType,
  SlashCommandBuilder,
  Guild,
} = require("discord.js");

const { getCreditsLeft, clearThreads } = require("../utils/openai.js");
const langs = require("../utils/langs.js");
const { collections, connectDB } = require("../utils/mongodb.js");
const rest = require("../utils/rest.js");
const { default: axios } = require("axios");
const path = require("path");

let topggRoot = "https://top.gg/api";
let topggToken = process.env.TOPGG_TOKEN;

/**
 * @type {Map<string, SlashCommandBuilder>}
 */
let commands = new Map();

const registerFiles = fs
  .readdirSync("./registers")
  .filter((file) => file.endsWith(".js"));

for (const file of registerFiles) {
  /**
   * @type {SlashCommandBuilder | undefined}
   */
  let command = require(`../registers/${file}`);
  let name = file.split(".")[0];

  if (!command) {
    console.log(`${name} command doesn't have data.`);
  } else {
    // Set locales name and description

    commands.set(command.name, command);
  }
}

module.exports =
  /**
   *
   * @param {Client} client
   */
  async (client) => {
    // await clearThreads();

    let credits = await getCreditsLeft();

    await client.guilds.fetch();

    let sortedGuilds = client.guilds.cache.sort((a, b) => {
      let botA = a.members.me;
      let botB = b.members.me;

      return botA.joinedTimestamp - botB.joinedTimestamp;
    });

    let guildsText = "Guilds: \n";

    for (let [id, guild] of sortedGuilds) {
      guildsText += `- ${guild.name} (${id}) \n`;
    }

    let presenceIndex = 0;

    // Update credits, 5 requests per min rate limit

    setInterval(async () => {
      let newCredits = await getCreditsLeft();

      if (
        !(
          credits.available === newCredits.available &&
          credits.paidBalance === credits.paidBalance
        )
      ) {
        credits = newCredits;
        console.log(
          `API Grants - Balance: $${credits.available} / $${credits.paidBalance}`
        );
      }
    }, 70000);

    // Update Presence Function
    async function updatePresence() {
      let guilds = await client.guilds.fetch();

      let bans = await collections.bans.find().toArray();
      let banCount = bans.length;

      let presences = [
        {
          name: `${guilds.size} guild${guilds.size > 1 ? "s" : ""} | /help`,
          state: `${banCount} trolls removed with human confirmation`,
          type: ActivityType.Watching,
          ms: 15000,
        },
        {
          name: `Global credits: $${credits.available} / $${credits.paidBalance}`,
          type: ActivityType.Custom,
          ms: 4000,
        },
        {
          name: `support: DM me!`,
          state: `Issues? Suggestions?`,
          type: ActivityType.Watching,
          ms: 1000,
        },
        {
          name: `support: DM me!`,
          state: `Questions? Premium Request?`,
          type: ActivityType.Watching,
          ms: 1000,
        },
      ];

      client.user.setPresence({
        status: "dnd",
        activities: [presences[presenceIndex]],
      });

      return presences;
    }

    let presences = await updatePresence();

    setInterval(async () => {
      presences = await updatePresence();

      if (presences.length - 1 === presenceIndex) {
        presenceIndex = 0;
      } else {
        presenceIndex++;
      }
    }, presences[presenceIndex].ms || 6000);

    /**
     *
     * @param {Guild} guild
     */
    async function updateCommands(guild, startup = false) {
      let cmds = [];
      let cmdCount = 0;
      let cmdStringList = "";
      let totalCmdsCount =
        fs.readdirSync(path.join(process.cwd(), "interactions")).length - 1;

      let deployText = `Deploying commands right now ${
        startup === true
          ? `in ${sortedGuilds.length - 1} guilds`
          : `in ${guild.name} guild`
      }...`;

      console.log(deployText);

      for (let [name, command] of commands) {
        try {
          let lang = guild.preferredLocale || "en-US";
          let lg = langs[lang] || langs["en-US"];

          if (!lg.helpCommands[name]) {
            // console.log(`Command ${name} doesn't have locales.`);
          } else {
            command = command
              .setNameLocalization(lang, lg.helpCommands[name].localeName)
              .setDescriptionLocalization(
                lang,
                lg.helpCommands[name].localeDescription
              );
          }

          cmdCount++;
          cmdStringList += `${cmdCount}. /${command.name}, `;

          cmds.push(command.toJSON());
        } catch (e) {}
      }

      try {
        await rest.put(
          Routes.applicationGuildCommands(client.user.id, guild.id),
          {
            body: cmds,
          }
        );

        console.log(
          `Deployed ${cmdCount} commands in ${guild.name} guild. (${cmdStringList})`
        );
      } catch (e) {
        console.log("Error deploying commands.");
      }
    }

    console.log(`_______________      _______________       ______  ___     _________
___  ____/__  /___  ____  __/__  __/____  ____   |/  /___________  /
__  /_   __  /_  / / /_  /_ __  /_ __  / / /_  /|_/ /_  __ \\  __  / 
_  __/   _  / / /_/ /_  __/ _  __/ _  /_/ /_  /  / / / /_/ / /_/ /  
/_/      /_/  \\__,_/ /_/    /_/    _\\__, / /_/  /_/  \\____/\\__,_/   
                                    /____/`);
    console.log(`Logged in as ${client.user.username}`);
    await connectDB();
    require("../app/server.js");

    socket.emit("ready", () => {
      console.log("Socket is ready.");
    });

    console.log(guildsText);
    console.log(
      `API Grants - Balance: $${credits.available} / $${credits.paidBalance}`
    );

    (async () => {
      try {
        let arrayCommands = Array.from(commands);
        let guilds = await client.guilds.fetch();

        for (let [id, guild] of guilds) {
          let fetchedGuild = await guild.fetch();
          await updateCommands(fetchedGuild);
        }

        if (arrayCommands.length === 0) {
          console.log("No slash commands to load.");
        }
      } catch (error) {
        console.error(error);
      }
    })();

    const fs = require("fs");

    // Load events

    const eventFiles = fs
      .readdirSync(__dirname)
      .filter((file) => file.endsWith(".js"));

    for (const file of eventFiles) {
      if (file === "ready.js") break;

      const event = require(`./${file}`);

      let name = file.split(".")[0];

      console.log(`Event ${name} loaded.`);

      client.on(name, event);
    }

    client.on("guildUpdate", async (oldGuild, newGuild) => {
      // Check if the guild locale changed

      if (oldGuild.preferredLocale !== newGuild.preferredLocale) {
        // Update the slash commands locale name and description
        await updateCommands(newGuild);
      }
    });

    client.on("guildCreate", async (guild) => {
      // Update the slash commands locale name and description
      await updateCommands(guild);

      // Set a presence to say thank you the user (guild) for adding the bot

      guilds = await client.guilds.fetch();

      guild.client.user.setPresence({
        status: "online",
        activities: [
          {
            name: `Thank you for adding me to ${guild.name}!`,
            type: ActivityType.Custom,
          },
        ],
      });

      setTimeout(async () => {
        await updatePresence();
      }, 1000);
    });

    async function updatesStats() {
      let url = `${topggRoot}/bots/${client.user.id}/stats`;
      let guilds = await client.guilds.fetch();

      let guildsCount = guilds.size;

      await axios
        .post(
          url,
          {
            server_count: guildsCount,
          },
          {
            headers: {
              Authorization: `Bearer ${topggToken}`,
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => {
          console.log(`Updated stats: ${res.data}`);
        })
        .catch((e) => {
          console.error(e);
        });
    }

    let argv = process.argv.slice(2);

    if (argv[0] === "--local") return;

    updatesStats();
    client.on("guildCreate", updatesStats);
    client.on("guildDelete", updatesStats);
  };
