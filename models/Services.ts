import { Schema, model, models, Document, Types } from "mongoose";

export interface IServices extends Document {
  _id: Types.ObjectId;
  id: string;
  name: string;
  fee: number;
  href: string;

  createdAt: Date;
  updatedAt: Date;
}

const servicesSchema = new Schema<IServices>(
  {
    id: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    fee: { type: Number, required: true },
    href: { type: String, required: true, unique: true },
  },
  {
    timestamps: true,
  }
);


// Fix for Next.js hot reload
const Services = models.Service || model<IServices>("Service", servicesSchema);

export default Services;
