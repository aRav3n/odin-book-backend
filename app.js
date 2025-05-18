const express = require("express");
const app = express();
const router = require("./routes/router");
const cors = require("cors");

const allowList = [
  "http://localhost:5173/"
];
const corsOptions = {
  origin: allowList,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express app listening on port ${PORT}!`));