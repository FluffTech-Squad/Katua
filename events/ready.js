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
const { openai, getCreditsLeft } = require("../openai");
const langs = require("../langs.js");

// Clear Threads

async function clearThreads() {
  let threadFilePath = __dirname.replace("events", "threads.txt");
  let threadsFile = fs.readFileSync(threadFilePath, "utf-8");

  let threadIds = threadsFile.split("\n");

  for (let thread_id of threadIds) {
    if (thread_id === "") break;

    await openai.threads.del(thread_id);
  }

  fs.writeFileSync(threadFilePath, "");
}

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

    client.user.setPresence({
      status: "dnd",
      activities: [
        {
          name: "trolls being banned.",
          state: "Furry servers being safer.",
          type: ActivityType.Watching,
        },
      ],
    });

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
  };
