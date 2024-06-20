// ready event

// Loading commands' datas
const fs = require("fs");

const {
  REST,
  Routes,
  Client,
  ActivityType,
  SlashCommandBuilder,
} = require("discord.js");

const { getCreditsLeft, clearThreads } = require("../utils/openai.js");
const langs = require("../utils/langs.js");
const isPremium = require("../utils/isPremium.js");
const { collections } = require("../utils/mongodb.js");

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

console.log(`_______________      _______________       ______  ___     _________
___  ____/__  /___  ____  __/__  __/____  ____   |/  /___________  /
__  /_   __  /_  / / /_  /_ __  /_ __  / / /_  /|_/ /_  __ \\  __  / 
_  __/   _  / / /_/ /_  __/ _  __/ _  /_/ /_  /  / / / /_/ / /_/ /  
/_/      /_/  \\__,_/ /_/    /_/    _\\__, / /_/  /_/  \\____/\\__,_/   
                                   /____/`);

module.exports =
  /**
   *
   * @param {Client} client
   */
  async (client) => {
    // await clearThreads();

    console.log(`Logged in as ${client.user.username}`);

    let credits = await getCreditsLeft();

    console.log(
      `API Grants - Balance: $${credits.available} / $${credits.paidBalance}`
    );

    let guilds = await client.guilds.fetch();
    let guildsText = "Guilds: \n";

    for (let [id, guild] of guilds) {
      guildsText += `- ${guild.name} (${id}) \n`;
    }

    console.log(guildsText);

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

      let bans = await collections.bans.find({}).toArray();
      let banCount = bans.length;

      // Fetch guilds having premium
      let premiumGuildsCount = 0;

      for (let [, guild] of guilds) {
        if (await isPremium(guild)) {
          premiumGuildsCount++;
        }
      }

      // Fetch guilds not having premium

      let nonPremiumGuildsCount = guilds.size - premiumGuildsCount;

      let presences = [
        {
          name: `${guilds.size} guild${guilds.size > 1 ? "s" : ""} | /help`,
          state: `${banCount} trolls removed with human confirmation`,
          type: ActivityType.Watching,
        },
        {
          name: `Global credits: $${credits.available} / $${credits.paidBalance}`,
          type: ActivityType.Watching,
        },
        {
          name: `${premiumGuildsCount}/${nonPremiumGuildsCount} premium guild${
            guilds.size > 1 ? "s" : ""
          }`,
          type: ActivityType.Watching,
        },
        {
          name: `DM ${client.user.username} for support.`,
          type: ActivityType.Custom,
        },
      ];

      client.user.setPresence({
        status: "dnd",
        activities: [presences[presenceIndex]],
      });

      return presences.length - 1;
    }

    let presencesIndexes = await updatePresence();

    setInterval(async () => {
      presencesIndexes = await updatePresence();

      if (presencesIndexes === presenceIndex) {
        presenceIndex = 0;
      } else {
        presenceIndex++;
      }
    }, 9000);

    const rest = new REST().setToken(client.token);

    async function updateCommands(guild) {
      let cmds = [];

      for (let [name, command] of commands) {
        let lang = guild.preferredLocale || "en-US";
        let lg = langs[lang];
        let c = command
          .setNameLocalization(lang, lg.helpCommands[name].localeName)
          .setDescriptionLocalization(
            lang,
            lg.helpCommands[name].localeDescription
          );

        cmds.push(c.toJSON());
      }

      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        {
          body: cmds,
        }
      );
    }

    (async () => {
      try {
        console.log("Loading slash commands...");

        let arrayCommands = Array.from(commands);

        for (const [name, command] of arrayCommands) {
          console.log(`Command load: /${name} command.`);
        }

        let guilds = await client.guilds.fetch();

        // await rest.put(Routes.applicationCommands(client.user.id), {
        //   body: [],
        // });

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
  };
