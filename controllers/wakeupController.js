const { wakeUpBackendDatabase } = require("../db/queries");
const { generateIndividualErrorMessage } = require("./internalFunctions");

async function wakeUpDatabase(req, res) {
  const count = await wakeUpBackendDatabase();
  if (!count) {
    return res
      .status(403)
      .json(
        generateIndividualErrorMessage(
          "Couldn't get a count from the database."
        )
      );
  }

  return res
    .status(200)
    .json({ message: "Database is awake and ready for coffee!" });
}

module.exports = { wakeUpDatabase };
