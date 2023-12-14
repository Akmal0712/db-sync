import mongoose, { Schema } from "mongoose";

const customerAnonymizedSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  address: {
    line1: { type: String, required: true },
    line2: { type: String, required: true },
    postcode: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const CustomerAnonymizedModel = mongoose.model(
  "CustomerAnonymized",
  customerAnonymizedSchema,
  "customers_anonymized",
);
export default CustomerAnonymizedModel;
