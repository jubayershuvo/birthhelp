import mongoose from "mongoose";
import { Document, Schema } from "mongoose";

export interface IData extends Document {
  title: string;
  amount: number;
  attachments: [
    {
      name: string;
    }
  ];
}

const dataSchema = new Schema<IData>(
  {
    title: { type: String, required: true },
    amount: { type: Number, default: 0 },
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
