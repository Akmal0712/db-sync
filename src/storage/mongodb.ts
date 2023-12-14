import mongoose from "mongoose";

export async function mongodb(url: string) {
  const mongooseClient = await mongoose.connect(url);
  console.log("MongoDB connected");

  return mongooseClient;
}
