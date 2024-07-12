const { collections } = require("./mongodb");

let { premiumGuilds } = collections;

function generateTransactionId(len = 10) {
  let transaction_id = "";
  let characters = "abcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < len; i++) {
    transaction_id += characters[Math.floor(Math.random() * characters.length)];
  }

  return transaction_id;
}

/**
 *
 * @param {string} guild_id
 * @param {*} start_date Dates must be UTC number
 * @param {*} end_date Dates must be UTC number
 *
 * @returns
 */
async function givePremium(guild_id, start_date, end_date) {
  let data = await premiumGuilds.findOne({ guild_id });

  if (data) return false;

  let transaction_id = generateTransactionId();
}
