// Adds the translated team text to your existing messages/*.json files.
// It only sets Home.team in each file. Everything else in them is left exactly as it is.
const fs = require("fs");
const path = require("path");

const team = JSON.parse(fs.readFileSync(path.join(__dirname, "team-text.json"), "utf8"));

for (const lang of ["en", "fr", "de", "es", "zh"]) {
  const file = path.join(__dirname, "messages", lang + ".json");
  if (!fs.existsSync(file)) {
    console.log("SKIPPED (file not found): messages/" + lang + ".json");
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
  if (!data.Home) data.Home = {};
  data.Home.team = team[lang];
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("updated messages/" + lang + ".json");
}
