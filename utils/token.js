// Detect if it is a local process or a hosted node js process

// Path: ../index.js
// Process is run at process.cwd like node index.js
let args = process.argv.slice(2);

// the first argument defines the environment
let token = "";

let environment = args[0] || "--prod";

if (environment === "--local") {
  token = process.env.DEV_TOKEN;
} else if (environment === "--prod") {
  token = process.env.TOKEN;
}

module.exports = token;
