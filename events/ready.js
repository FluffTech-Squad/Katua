// ready event

// Loading commands' datas
const fs = require("fs");

const { REST, Routes, Client, ActivityType } = require("discord.js");

let commands = new Map();

const registerFiles = fs
  .readdirSync("./registers")
  .filter((file) => file.endsWith(".js"));

for (const file of registerFiles) {
  const command = require(`../registers/${file}`);
  let name = file.split(".")[0];

  if (!command) {
    console.log(`${name} command doesn't have data.`);
  } else {
    command.setName(name);

    commands.set(name, command.toJSON());
  }
}
const { default: axios } = require("axios");

// Request to OpenAI API how many credits are left

async function getCreditsLeft() {
  return new Promise(async (resolve, reject) => {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let startDate = "2024-06-01";

    let end_date = `${year}-${month + 1}-01`;
    let rootCredits = `https://api.openai.com/dashboard/billing/credit_grants?end_date=${end_date}&start_date=${startDate}&project_id=${process.env.OPENAI_PROJECT_ID}`;

    let response = await axios.get(rootCredits, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_SESS}`,
      },
    });

    let data = response.data;
    let grants = data.grants.data;
    let lastGrant = grants.at(-1);

    let paidBalance = lastGrant.grant_amount;
    let available = lastGrant.grant_amount - lastGrant.used_amount;

    // Turns them into doubles digits
    // Example: $1 to $1.00

    paidBalance = paidBalance.toFixed(2);
    available = available.toFixed(2);

    resolve({ available, paidBalance });
  });
}

module.exports =
  /**
   *
   * @param {Client} client
   */
  async (client) => {
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
