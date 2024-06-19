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
} = require("../utils/openai.js");
const langs = require("../utils/langs.js");
const isPremium = require("../utils/isPremium.js");

/**
 * @type {Map<string, import("discord.js").RESTPostAPIChatInputApplicationCommandsJSONBody>}
 */
let commands = new Map();

const registerFiles = fs
  .readdirSync("./registers")
  .filter((file) => file.endsWith(".js"));

for (const file of registerFiles) {
  /**
   * @type {SlashCommandBuilder | undefined}
   */
  const command = require(`../registers/${file}`);
  let name = file.split(".")[0];

  if (!command) {
    console.log(`${name} command doesn't have data.`);
  } else {
    command.setName(name);

    // Set locales name and description

    let locales = Object.keys(langs);

    for (let locale of locales) {
      command.setNameLocalization(
        locale,
        langs[locale]["helpCommands"][name]["localeName"]
      );
      command.setDescriptionLocalization(
        locale,
        langs[locale]["helpCommands"][name]["localeDescription"]
      );
    }

    commands.set(name, command.toJSON());
  }
}

module.exports =
  /**
   *
   * @param {Client} client
   */
  async (client) => {
    // await clearThreads();

    // Print this commented message when the bot is ready
    /*  _______________      _______________       ______  ___     _________
    ___  ____/__  /___  ____  __/__  __/____  ____   |/  /___________  /
    __  /_   __  /_  / / /_  /_ __  /_ __  / / /_  /|_/ /_  __ \  __  / 
    _  __/   _  / / /_/ /_  __/ _  __/ _  /_/ /_  /  / / / /_/ / /_/ /  
    /_/      /_/  \__,_/ /_/    /_/    _\__, / /_/  /_/  \____/\__,_/   
                                       /____/                           
    */

    console.log(`_______________      _______________       ______  ___     _________
___  ____/__  /___  ____  __/__  __/____  ____   |/  /___________  /
__  /_   __  /_  / / /_  /_ __  /_ __  / / /_  /|_/ /_  __ \\  __  / 
_  __/   _  / / /_/ /_  __/ _  __/ _  /_/ /_  /  / / / /_/ / /_/ /  
/_/      /_/  \\__,_/ /_/    /_/    _\\__, / /_/  /_/  \\____/\\__,_/   
                                       /____/`);

    console.log(`Logged in as ${client.user.username}`);

    let credits = await getCreditsLeft();

    console.log(
      `API Grants - Balance: $${credits.available} / $${credits.paidBalance}`
    );

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

    (async () => {
      try {
        console.log("Loading slash commands...");

        let arrayCommands = Array.from(commands);

        for (const [name, command] of arrayCommands) {
          console.log(`Loading /${name} command...`);
        }

        let data = await rest.put(Routes.applicationCommands(client.user.id), {
          body: arrayCommands.map((command) => command[1]),
        });

        if (arrayCommands.length === 0) {
          console.log("No slash commands to load.");
        } else {
          for (const command of data) {
            console.log(`/${command.name} command loaded successfully.`);
          }
        }
      } catch (error) {
        console.error(error);
      }
    })();

    client.on("guildBanAdd", async (ban) => {
      let banCountFile = fs.readFileSync(
        __dirname.replace("events", "ban_count.txt"),
        "utf-8"
      );

      let threadsFile = fs.readFileSync(
        __dirname.replace("events", "threads.txt"),
        "utf-8"
      );
      let threadIds = threadsFile.split("\n");
      let thread = null;

      for (let thread_id of threadIds) {
        if (thread_id === "") break;

        let threadx = await openai.threads.retrieve(thread_id);

        if (
          threadx.metadata.guild === ban.guild.id &&
          threadx.metadata.user === ban.user.id
        ) {
          thread = threadx;

          await openai.threads.del(thread_id);

          let threads = threadIds.filter((id) => id !== thread_id);

          fs.writeFileSync(
            __dirname.replace("events", "threads.txt"),
            threads.join("\n")
          );
        }

        let messages = await openai.threads.messages.list(thread.id);
        let ok = false;

        for (let msg of messages.data) {
          if (msg.role === "assistant") {
            if (msg.metadata === "analysis") {
              if (
                msg.content[0].text.value === "invalid" ||
                msg.content[0].text.value === "neutral"
              ) {
                if (!ok) {
                  let banCount = parseInt(banCountFile);
                  banCount++;

                  fs.writeFileSync(
                    __dirname.replace("events", "ban_count.txt"),
                    banCount.toString()
                  );

                  ok = true;
                }
              }
            }
          }
        }
      }
    });
  };
