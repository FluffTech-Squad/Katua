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

module.exports =
  /**
   *
   * @param {Client} client
   */
  async (client) => {
    console.log(`Logged in as ${client.user.tag}`);

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
