const fs = require("fs");

const {
  Routes,
  Client,
  ActivityType,
  SlashCommandBuilder,
} = require("discord.js");

const { getCreditsLeft } = require("../utils/openai.js");
const { connectDB } = require("../utils/mongodb.js");
const rest = require("../utils/rest.js");
const { default: axios } = require("axios");

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

    /**
     * @type {import("discord.js").PresenceData[]}
     */
    let presences = [
      {
        status: "online",
        activities: [
          {
            name: `/help | katua.xyz`,
            type: ActivityType.Watching,
          },
        ],
        cd: 15 * 1000,
      },
      {
        status: "online",
        activities: [
          {
            name: `/help | ${
              credits
                ? `$${credits.available} / $${credits.paidBalance}`
                : "Credits usage"
            }`,
            type: ActivityType.Watching,
          },
        ],
        cd: 3000,
      },
    ];

    let i = 0;

    client.user.setPresence(presences[i]);

    setInterval(() => {
      i = i ? 0 : 1;

      client.user.setPresence(presences[i]);
    }, presences[i].cd);

    console.log(`ASCII Art Brand Name Here`);
    console.log(`Logged in as ${client.user.username}`);
    await connectDB();
    require("../app/server.js");

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

    const eventFolders = fs
      .readdirSync(__dirname)
      .filter((folder) => fs.lstatSync(`${__dirname}/${folder}`).isDirectory());

    for (const folder of eventFolders) {
      let eventName = folder;
      let instanceCount = 0;

      let eventInstanceFiles = fs
        .readdirSync(`${__dirname}/${folder}`)
        .filter((file) => file.endsWith(".js"));

      let events = [];

      for (const file of eventInstanceFiles) {
        const event = require(`./${folder}/${file}`);

        instanceCount++;

        events.push({ exec: event, name: file.replace(".js", "") });
      }

      if (events.find((e) => e.name === "main")) {
        let mainEvent = events.find((e) => e.name === "main");

        client.on(eventName, mainEvent.exec);
      }

      events = events.filter((e) => e.name !== "main");

      for (const event of events) {
        client.on(eventName, event.exec);
      }

      console.log(
        `Event ${eventName} loaded with ${instanceCount} different instances.`
      );
    }

    try {
      let data = await rest.put(
        Routes.applicationCommands(client.application.id),
        {
          body: Array.from(commands.values()).map((c) => c.toJSON()),
        }
      );

      console.log(`Refreshed ${data.length} slash commands.`);
    } catch (e) {
      console.log("Error deploying commands.");
    }

    console.log(guildsText);

    if (credits) {
      console.log(
        `API Grants - Balance: $${credits.available} / $${credits.paidBalance}`
      );
    }

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
          console.log(`Updated stats: ${JSON.stringify(res.data)}`);
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
