const { io } = require("socket.io-client");
require("dotenv").config();

let socket = io("http://fluffymod.nekomancer.quest", { autoConnect: true });

socket.auth = {
  token: process.env.SOCKET_TOKEN,
};

// Reconnect on disconnect

socket.on("disconnect", () => {
  console.log("Disconnected from the socket server. Reconnecting...");
  socket.connect();
});

module.exports = socket;
