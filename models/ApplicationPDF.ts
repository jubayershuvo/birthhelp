import { Schema, model, models, Document, Types } from "mongoose";

export interface IDownload extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  path: string;
  name: string;
  type: string;
  title: string;
}

const servicesSchema = new Schema<IDownload>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    path: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Fix for Next.js hot reload
const File = models.File || model<IDownload>("File", servicesSchema);

export default File;
