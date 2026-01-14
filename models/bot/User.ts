import { Schema, model, models, Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  whatsapp?: string;
  isBanned: boolean;

  balance: number;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    whatsapp: { type: String, default: "" },
    isBanned: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Fix for Next.js hot reload
const User = models.User || model<IUser>("User", UserSchema);

export default User;
