const { io } = require("socket.io-client");
require("dotenv").config();

let socket = io("https://api.katua.xyz", { autoConnect: true });

module.exports = socket;
