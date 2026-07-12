const express = require("express");
const PORT = 3000;

const app = express();

app.use("/", (req, res, next) => {
  res.send("<h1> App Runnig </h1>");
});

app.listen(PORT, () => {
  console.log(`listing on port ${PORT}`);
});
