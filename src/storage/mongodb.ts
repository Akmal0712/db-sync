import mongoose from "mongoose";
import * as process from "process";

export async function mongodb() {
  await mongoose.connect(process.env.DB_URI!);
  mongoose.set("toJSON", { versionKey: false, virtuals: true });
  mongoose.set("toObject", { versionKey: false, virtuals: true });

  console.log("MongoDB connected");
}