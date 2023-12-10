import mongoose, { Schema } from "mongoose";

const customerAnonymizedSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String },
    address: {
      line1: { type: String, required: true },
      line2: { type: String },
      postcode: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },
  },
  { timestamps: true },
);

const CustomerAnonymizedModel = mongoose.model(
  "CustomerAnonymized",
  customerAnonymizedSchema,
  "customers_anonymized",
);
export default CustomerAnonymizedModel;
