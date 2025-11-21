import mongoose, { Document, Schema } from "mongoose";

export interface IBirthCertificate extends Document {
  _id: string;
  qrCode: string;
  barCode: string;
  createdAt: string;
  updatedAt: string;
  qrCodeData: string;
  barcodeData: string;
  birthRegNumber: string;
  registrationDate?: string;
  issuanceDate?: string;
  dateOfBirth?: string;
  registrationOffice?: string;
  sex?: string;
  personNameBn?: string;
  personNameEn?: string;
  birthPlaceBn?: string;
  birthPlaceEn?: string;
  motherNameBn?: string;
  motherNameEn?: string;
  motherNationalityBn?: string;
  motherNationalityEn?: string;
  fatherNameBn?: string;
  fatherNameEn?: string;
  fatherNationalityBn?: string;
  fatherNationalityEn?: string;
  officeLocation?: string;
  permanentAddressBn?: string;
  permanentAddressEn?: string;
  randomCode?: string;
  verificationKey?: string;
  dateInWords?: string;
  certificateNumber?: string;
  charged?: boolean;
  amount_charged?: number;
}

const birthCertificateSchema = new Schema<IBirthCertificate>(
  {
    registrationDate: { type: String },
    registrationOffice: { type: String },
    issuanceDate: { type: String },
    dateOfBirth: { type: String },
    birthRegNumber: { type: String,},
    sex: { type: String },
    personNameBn: { type: String },
    personNameEn: { type: String },
    birthPlaceBn: { type: String },
    birthPlaceEn: { type: String },
    motherNameBn: { type: String },
    motherNameEn: { type: String },
    motherNationalityBn: { type: String },
    motherNationalityEn: { type: String },
    fatherNameBn: { type: String },
    fatherNameEn: { type: String },
    fatherNationalityBn: { type: String },
    fatherNationalityEn: { type: String },
    officeLocation: { type: String },
    permanentAddressBn: { type: String, default: "" },
    permanentAddressEn: { type: String, default: "" },
    randomCode: { type: String },
    verificationKey: { type: String },
    qrCodeData: { type: String },
    barcodeData: { type: String },
    dateInWords: { type: String },
    certificateNumber: { type: String },
    charged: { type: Boolean, default: false },
    amount_charged: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.BirthCertificate ||
  mongoose.model("BirthCertificate", birthCertificateSchema);
