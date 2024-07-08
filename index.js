const child_process = require("child_process");

// Pull the latest changes from the github repository if it is not the local workspace

// try {
//   if (child_process.execSync("git status --porcelain").toString() !== "") {
//     console.log(
//       "Local workspace is not clean, please commit your changes first."
//     );

//     process.exit(1);
//   }
// } catch (e) {}

// Set origin repository

// child_process.execSync(`git config --global credential.helper manager
// printf "protocol=https\nhost=github.com\nusername=<me>\npassword=<my_token>" |\
//   git-credential-manager store`);

// child_process.execSync("git pull");

// child_process.execSync("node --require ./appsignal.cjs ./bot.js");

require("./bot.js");
