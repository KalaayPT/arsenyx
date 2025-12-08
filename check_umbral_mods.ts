import fs from "fs";
import path from "path";

const modsPath = path.join(process.cwd(), "src/data/warframe/Mods.json");
const modsData = JSON.parse(fs.readFileSync(modsPath, "utf-8"));

const fiber = modsData.find((m: any) => m.name === "Umbral Fiber");
const intensify = modsData.find((m: any) => m.name === "Umbral Intensify");

console.log("--- Umbral Fiber ---");
if (fiber) {
  console.log(
    JSON.stringify(
      {
        levelStats: fiber.levelStats
          ? fiber.levelStats[fiber.levelStats.length - 1]
          : "No levelStats",
        stats: fiber.stats,
        modSet: fiber.modSet,
      },
      null,
      2
    )
  );
}

console.log("\n--- Umbral Intensify ---");
if (intensify) {
  console.log(
    JSON.stringify(
      {
        levelStats: intensify.levelStats
          ? intensify.levelStats[intensify.levelStats.length - 1]
          : "No levelStats",
        stats: intensify.stats,
        modSet: intensify.modSet,
      },
      null,
      2
    )
  );
}
