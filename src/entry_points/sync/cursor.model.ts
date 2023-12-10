import mongoose, { Schema } from "mongoose";

const CursorSchema = new Schema({
  skip: { type: Number, default: 0 },
});

const CursorModel = mongoose.model("Cursor", CursorSchema, "cursor");
export default CursorModel;
