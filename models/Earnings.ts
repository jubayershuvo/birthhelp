import mongoose, { Schema, Types } from "mongoose";

const earningsSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    reseller: { type: Types.ObjectId, ref: "Reseller", required: true },
    service: { type: Types.ObjectId, ref: "Service", required: true },
    data: { type: String },
    amount: { type: Number, required: true },
    dataSchema: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Earning || mongoose.model("Earning", earningsSchema);
