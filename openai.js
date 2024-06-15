const OpenAI = require("openai").default;

let openaiClient = new OpenAI({
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
  project: process.env.OPENAI_PROJECT_ID,
});

const openai = new OpenAI.Beta(openaiClient);

module.exports = { openaiClient, openai };
