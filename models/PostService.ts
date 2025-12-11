import mongoose from "mongoose";
import { Document, Schema } from "mongoose";

export interface IData extends Document {
  title: string;
  description: string; // long textarea
  admin_fee: number;
  worker_fee: number;
  reseller_fee: number;
  attachments: [
    {
      name: string;
    }
  ];
}

const dataSchema = new Schema<IData>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true }, // long textarea
    admin_fee: { type: Number, required: true },
    worker_fee: { type: Number, required: true },
    reseller_fee: { type: Number, default: 0 },
    attachments: [
      {
        name: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.PostService ||
  mongoose.model("PostService", dataSchema);
