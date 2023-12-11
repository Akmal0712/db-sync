import mongoose from "mongoose";

export async function mongodb(url: string) {
  await mongoose.connect(url);
  mongoose.set("toJSON", { versionKey: false, virtuals: true });
  mongoose.set("toObject", { versionKey: false, virtuals: true });

  console.log("MongoDB connected");
}
