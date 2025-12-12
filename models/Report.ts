import { model, models, Schema, Types } from "mongoose";

export interface IReport {
  reason: string;
  user: Types.ObjectId;
  post?: Types.ObjectId;
}

export const reportSchema = new Schema<IReport>(
  {
    reason: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    post: { type: Schema.Types.ObjectId, ref: "Post" },
  },
  { timestamps: true }
);

export const Report = models.Report || model<IReport>("Report", reportSchema);
