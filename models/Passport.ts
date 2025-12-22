import mongoose, { Schema, Model, Types } from "mongoose";

/* 1️⃣ TypeScript interface */
export interface PassportData {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  passportNumber: string;
  name: string;
  fathersName?: string;
  mothersName?: string;
  spousesName?: string;
  permanentAddress?: string;

  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactAddress?: string;
  emergencyContactTelephone?: string;

  surname?: string;
  givenName?: string;
  nationality?: string;
  personalNumber?: string;
  birthDate?: string;
  gender?: string;
  birthPlace?: string;

  issueDate?: string;
  issuingAuthority?: string;
  expiryDate?: string;

  photo?: string;
  signature?: string;

  previousPassportNo?: string;
}

/* 2️⃣ Schema */
const PassportSchema = new Schema<PassportData>(
  {
    passportNumber: {
      type: String,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    fathersName: String,
    mothersName: String,
    spousesName: String,
    permanentAddress: String,

    emergencyContactName: String,
    emergencyContactRelationship: String,
    emergencyContactAddress: String,
    emergencyContactTelephone: String,

    surname: String,
    givenName: String,
    nationality: String,
    personalNumber: String,
    birthDate: String,
    gender: String,
    birthPlace: String,

    issueDate: String,
    issuingAuthority: String,
    expiryDate: String,

    photo: String,
    signature: String,

    previousPassportNo: String,
  },
  {
    timestamps: true,
  }
);

/* 3️⃣ Prevent model overwrite (VERY IMPORTANT for Next.js) */
const PassportModel: Model<PassportData> =
  mongoose.models.Passport ||
  mongoose.model<PassportData>("Passport", PassportSchema);

export default PassportModel;
