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
const {
  openai,
  getCreditsLeft,
  clearThreads,
  getThreadList,
  getMemberThread,
  isMemberValid,
} = require("../utils/openai.js");
const langs = require("../utils/langs.js");
const isPremium = require("../utils/isPremium.js");

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

    // setInterval(async () => {
    //   let newCredits = await getCreditsLeft();

    //   if (
    //     !(
    //       credits.available === newCredits.available &&
    //       credits.paidBalance === credits.paidBalance
    //     )
    //   ) {
    //     credits = newCredits;
    //     console.log(
    //       `API Grants - Balance: $${credits.available} / $${credits.paidBalance}`
    //     );
    //   }
    // }, 30000);

    // Update Presence Function
    async function updatePresence() {
      let guilds = await client.guilds.fetch();
      let banCountFile = fs.readFileSync(
        __dirname.replace("events", "ban_count.txt"),
        "utf-8"
      );

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
          name: `${guilds.size} server${guilds.size > 1 ? "s" : ""} | /help`,
          state: `${banCountFile} trolls removed in total.`,
          type: ActivityType.Watching,
        },
        {
          name: `${guilds.size} server${guilds.size > 1 ? "s" : ""} | /help`,
          state: `Global credits: $${credits.available} / $${credits.paidBalance}`,
          type: ActivityType.Watching,
        },
        {
          name: `${guilds.size} server${guilds.size > 1 ? "s" : ""} | /help`,
          state: `${premiumGuildsCount} premium server${
            premiumGuildsCount > 1 ? "s" : ""
          } | ${nonPremiumGuildsCount} non-premium server${
            nonPremiumGuildsCount > 1 ? "s" : ""
          }`,
          type: ActivityType.Watching,
        },
        {
          name: `DM me for support.`,
          state: `${banCountFile} trolls removed in total.`,
          type: ActivityType.Watching,
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
    }, 11000);

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
          body: [],
        }
      );

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
          console.log(`Loading /${name} command...`);
        }

        let guilds = await client.guilds.fetch();

        await rest.put(Routes.applicationCommands(client.user.id), {
          body: [],
        });

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
    });
  };
