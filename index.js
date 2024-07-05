const child_process = require("child_process");

// Pull the latest changes from the github repository if it is not the local workspace

if (child_process.execSync("git status --porcelain").toString() !== "") {
  console.log(
    "Local workspace is not clean, please commit your changes first."
  );

  process.exit(1);
}

// Set origin repository

child_process.execSync("git init");

child_process.execSync("git remote add origin " + process.env.REPOSITORY);

child_process.execSync("git pull");

child_process.execSync("node --require ./appsignal.cjs ./bot.js");
