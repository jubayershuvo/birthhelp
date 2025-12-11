import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPost extends Document {
  service: Types.ObjectId;
  user: Types.ObjectId;
  worker: Types.ObjectId;
  description: string;
  admin_fee: number;
  worker_fee: number;
  reseller_fee: number;
  deliveryFile?: {
    name: string;
    fileId: string;
  };
  files: {
    name: string;
    fileId: string;
  }[];
  status: string;
}

const PostSchema = new Schema<IPost>(
  {
    service: {
      type: Schema.Types.ObjectId,
      ref: "PostService",
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    worker: { type: Schema.Types.ObjectId, ref: "Reseller" },
    admin_fee: { type: Number, required: true },
    worker_fee: { type: Number, required: true },
    reseller_fee: { type: Number, default: 0 },
    description: { type: String, required: true },
    deliveryFile: {
      name: { type: String },
      fileId: { type: String },
    },
    files: [
      {
        name: { type: String, required: true },
        fileId: { type: String, required: true },
      },
    ],
    status: {
      type: String,
      default: "pending", // pending → processing → completed
    },
  },
  { timestamps: true }
);

export default mongoose.models.Post || mongoose.model("Post", PostSchema);
