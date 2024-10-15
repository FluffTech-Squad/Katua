const OpenAI = require("openai").default;
require("dotenv").config();

let openaiClient = new OpenAI({
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

const openai = new OpenAI.Beta(openaiClient);

const { default: axios } = require("axios");

// Request to OpenAI API how many credits are left

/**
 *
 * @returns {Promise<{available: number, paidBalance: number}>}
 */
async function getCreditsLeft() {
  return new Promise(async (resolve, reject) => {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let startDate = "2024-06-01";

    let end_date = `${year}-${month + 1}-01`;
    let root = `https://api.openai.com/v1/dashboard/billing/credit_grants?start_date=${startDate}&end_date=${end_date}`;

    try {
      let response = await axios.get(root, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_SESS}`,
        },
        params: {
          date: end_date,
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
    } catch (e) {
      console.log(e.response);
      console.log("Couldn't load credits");
      resolve(null);
    }
  });
}

/**
 * @returns {Promise<import("openai").default.Beta.Thread[]>}
 */

async function getThreadList() {
  return new Promise(async (resolve, reject) => {
    let root = "https://api.openai.com/v1/threads?limit=30";

    try {
      let response = await axios.get(root, {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_SESS}`,
          "Openai-Beta": "assistants=v2",
          "Openai-Organization": process.env.OPENAI_ORG_ID,
          "Openai-Project": process.env.OPENAI_PROJECT_ID,
        },
      });

      resolve(response.data.data);
    } catch (e) {
      console.log(e.data);
      return [];
    }
  });
}

async function clearThreads() {
  let threads = await getThreadList();

  for (let thread of threads) {
    await openai.threads.del(thread.id);
  }
}

/**
 * @param {string} user_id
 */

async function getUserThread(user_id, assistant_id) {
  let threads = await getThreadList();
  for (let thread of threads) {
    if (thread.metadata.user === user_id) {
      return thread;
    }
  }

  return null;
}

/**
 * @param {import("openai").default.Beta.Thread} thread
 * @returns {Promise<boolean>}
 */
function isMemberValid(thread) {
  return new Promise(async (resolve, reject) => {
    let isValid = false;

    try {
      let messages = await openai.threads.messages.list(thread.id);
      let ok = false;

      for (let msg of messages.data) {
        if (msg.role === "assistant") {
          if (
            msg.metadata &&
            msg.metadata.type &&
            msg.metadata.type === "analysis"
          ) {
            let content = msg.content[0];

            if (content.type !== "text") break;

            let isUserValid = JSON.parse(content.text.value);

            if (isUserValid.status === "valid") {
              if (!ok) {
                isValid = true;
              }

              ok = true;
            }
          }
        }
      }
    } catch (e) {
      reject();
      return true;
    }

    resolve(isValid);
  });
}

module.exports = {
  openaiClient,
  openai,
  getCreditsLeft,
  getThreadList,
  clearThreads,
  getUserThread,
  isMemberValid,
};
