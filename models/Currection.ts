import mongoose, { Schema, model, Model } from "mongoose";

/* ---------------- File Schema ---------------- */
export interface IFile {
  id: string;
  name?: string;
  url?: string;
  deleteUrl?: string;
  attachmentTypeId: string;
  fileType?: string;
}

const fileSchema = new Schema<IFile>({
  id: { type: String, required: true },
  name: { type: String },
  url: { type: String },
  deleteUrl: { type: String, default: "" },
  attachmentTypeId: { type: String },
  fileType: { type: String },
});

/* ---------------- Correction Info ---------------- */
export interface ICorrectionInfo {
  id: string;
  key: string;
  value: string;
  cause: string;
}

const correctionInfoSchema = new Schema<ICorrectionInfo>({
  id: { type: String },
  key: { type: String },
  value: { type: String },
  cause: { type: String, default: "2" },
});

/* ---------------- Address Block ---------------- */
export interface IAddressBlock {
  country?: string;
  geoId?: string;
  division?: string;
  divisionName?: string;
  district?: string;
  districtName?: string;
  cityCorpCantOrUpazila?: string;
  upazilaName?: string;
  paurasavaOrUnion?: string;
  unionName?: string;
  postOfc?: string;
  postOfcEn?: string;
  vilAreaTownBn?: string;
  vilAreaTownEn?: string;
  houseRoadBn?: string;
  houseRoadEn?: string;
  ward?: string;
  wardName?: string;
}


const addressBlockSchema = new Schema<IAddressBlock>({
  country: { type: String, default: "-1" },
  geoId: { type: String, default: "" },
  division: { type: String, default: "-1" },
  divisionName: { type: String, default: "" },
  district: { type: String, default: "-1" },
  districtName: { type: String, default: "" },
  cityCorpCantOrUpazila: { type: String, default: "-1" },
  upazilaName: { type: String, default: "" },
  paurasavaOrUnion: { type: String, default: "-1" },
  unionName: { type: String, default: "" },
  postOfc: { type: String, default: "" },
  postOfcEn: { type: String, default: "" },
  vilAreaTownBn: { type: String, default: "" },
  vilAreaTownEn: { type: String, default: "" },
  houseRoadBn: { type: String, default: "" },
  houseRoadEn: { type: String, default: "" },
  ward: { type: String, default: "-1" },
  wardName: { type: String, default: "" },
});

/* ---------------- Applicant Info ---------------- */
export interface IApplicantInfo {
  name: string;
  officeId: number;
  email?: string;
  phone: string;
  relationWithApplicant: string;
}

const applicantInfoSchema = new Schema<IApplicantInfo>({
  name: { type: String, required: true },
  officeId: { type: Number, required: true },
  email: { type: String, default: "" },
  phone: { type: String },
  relationWithApplicant: { type: String, required: true },
});

/* ---------------- Main Interface ---------------- */
export interface IBdrisApplication {
  ubrn: string;
  dob: string;
  user?: mongoose.Types.ObjectId;
  submit_status?: string;
  applicationId?: string;
  printLink?: string;
  correctionInfos: ICorrectionInfo[];
  addresses?: {
    birthPlace?: IAddressBlock;
    permAddress?: IAddressBlock;
    prsntAddress?: IAddressBlock;
  };
  applicantInfo?: IApplicantInfo;
  files?: IFile[];
  otp?: string;
  captcha?: string;
  csrf?: string;
  cookies?: string[];
  isPermAddressIsSameAsBirthPlace?: boolean;
  isPrsntAddressIsSameAsPermAddress?: boolean;
  cost: number;
}

/* ---------------- Main Schema ---------------- */
const bdrisApplicationSchema = new Schema<IBdrisApplication>(
  {
    ubrn: { type: String, required: true },
    dob: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },

    submit_status: { type: String, default: "created" },
    applicationId: { type: String, default: "" },
    printLink: { type: String, default: "" },

    correctionInfos: { type: [correctionInfoSchema], default: [] },

    addresses: {
      birthPlace: { type: addressBlockSchema, default: {} },
      permAddress: { type: addressBlockSchema, default: {} },
      prsntAddress: { type: addressBlockSchema, default: {} },
    },

    applicantInfo: { type: applicantInfoSchema },

    files: { type: [fileSchema], default: [] },

    otp: { type: String },
    captcha: { type: String },
    csrf: { type: String },

    cost: { type: Number, default: 0 },

    cookies: { type: [String], default: [] },

    isPermAddressIsSameAsBirthPlace: { type: Boolean, default: false },
    isPrsntAddressIsSameAsPermAddress: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------------- Model Export ---------------- */
const CorrectionApplication: Model<IBdrisApplication> =
  mongoose.models.CurrectionApplication ||
  model<IBdrisApplication>("CurrectionApplication", bdrisApplicationSchema);

export default CorrectionApplication;
