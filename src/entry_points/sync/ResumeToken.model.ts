import mongoose, { Schema } from "mongoose";

const CursorSchema = new Schema({
  _data: { type: String, required: true },
});

const ResumeTokenModel = mongoose.model(
  "ResumeToken",
  CursorSchema,
  "resume_token",
);
export default ResumeTokenModel;
