const OpenAI = require("openai").default;

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

module.exports = { openaiClient, openai, getCreditsLeft };
