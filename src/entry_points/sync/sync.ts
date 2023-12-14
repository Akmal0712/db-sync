import { mongodb } from "../../storage/mongodb";
import { reindex, realTimeSync } from "./modes";
import "dotenv/config";
import { Mongoose } from "mongoose";

let mongooseClient: Mongoose;
(async () => {
  try {
    mongooseClient = await mongodb(process.env.DB_URI);
    const mode = process.argv[2];
    if (mode === "--full-reindex") {
      await reindex();
      console.log(`Reindex is done`);
      process.exit(0);
    }

    await realTimeSync();
  } catch (error) {
    console.log(error.message);
    await mongooseClient.disconnect();
  }
})();
