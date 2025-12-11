import { Schema, model, models, Document, Types } from "mongoose";

export interface IFile extends Document {
  _id: Types.ObjectId;
  name: string;
  path: string;
  ext: string;
  createdAt: Date;
  updatedAt: Date;
}

const servicesSchema = new Schema<IFile>(
  {
    name: { type: String, required: true },
    path: { type: String, required: true },
    ext: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Fix for Next.js hot reload
const PostFile = models.PostFile || model<IFile>("PostFile", servicesSchema);

export default PostFile;
