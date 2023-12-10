import mongoose, { Schema } from "mongoose";

const CursorSchema = new Schema({
  skip: { type: Number, default: 0 },
  lte: { type: Date, default: Date.now },
});

const CursorModel = mongoose.model("Cursor", CursorSchema, "cursor");
export default CursorModel;
