const token = require("./token");
const { REST } = require("discord.js");

const rest = new REST().setToken(token);

module.exports = rest;
