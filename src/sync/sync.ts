import { mongodb } from "../storage/mongodb";
import { reindex, realTimeSync } from "./modes";
import * as process from "process";
import "dotenv/config";

(async () => {
  try {
    await mongodb();
    console.log("MongoDB connected");

    const mode = process.argv[2];
    if (mode === "--full-reindex") {
      await reindex();
      process.exit(0);
    }

    await realTimeSync();
  } catch (error) {
    console.log(error.message);
  }
})();
