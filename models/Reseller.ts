import bcrypt from "bcryptjs";
import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IReseller extends Document {
  _id: string;
  name: string;
  avatar?: string;
  phone: string;
  email: string;
  telegramId?: string;
  whatsapp?: string;
  password: string;
  users: ObjectId[];
  balance: number;
  isBanned: boolean;
  lastLogin?: Date;
  lastLoginIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const resellerSchema = new Schema<IReseller>(
  {
    name: { type: String, required: true, trim: true },
    avatar: { type: String, default: "", trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    telegramId: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    balance: { type: Number, default: 0 },
    password: { type: String, required: true, trim: true },
    lastLogin: { type: Date, default: null },
    lastLoginIp: { type: String, default: "" },
    users: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isBanned: { type: Boolean, default: false },
  },
  { timestamps: true }
);
resellerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

export default mongoose.models.Reseller ||
  mongoose.model("Reseller", resellerSchema);
