// models/user.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

// TypeScript interface for type safety
export interface IUser extends Document {
  user: Types.ObjectId;
  appId: string;
  data: Array<{
    ubrn: string;
    personBirthDate: string;
    personNameBn: string | null;
    fatherNameBn: string | null;
    motherNameBn: string | null;
    officeNameBn: string;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Mongoose schema definition
const UserSchema: Schema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true, // Adding index for faster queries if needed
    },
    appId:{
      type: String,
    },
    data: [
      {
        ubrn: {
          type: String,
          required: true,
        },
        personBirthDate: {
          type: String,
          required: true,
        },
        personNameBn: {
          type: String,
          default: null,
        },
        fatherNameBn: {
          type: String,
          default: null,
        },
        motherNameBn: {
          type: String,
          default: null,
        },
        officeNameBn: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true, // This will automatically add createdAt and updatedAt fields
  }
);

// Create and export the model
export const AppData =
  mongoose.models.AppData || mongoose.model<IUser>("AppData", UserSchema);

// Alternative: If you want to check if model exists before creating
export default AppData;
