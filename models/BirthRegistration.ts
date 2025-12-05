import { Schema, model, models, Document, Types } from "mongoose";

export interface IAttachment {
  id: number;
  name: string;
  type: string;
  size: number;
}

export interface IPersonInfo {
  personFirstNameBn: string;
  personLastNameBn: string;
  personNameBn: string;
  personFirstNameEn: string;
  personLastNameEn: string;
  personNameEn: string;
  personBirthDate: string;
  thChild: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  religion: string;
  religionOther?: string;
  personNid?: string;
}

export interface IParentInfo {
  personNameBn: string;
  personNameEn: string;
  personNationality: string;
  personNid?: string;
  passportNumber?: string;
  ubrn?: string;
  personBirthDate: string;
}

export interface IBirthRegistration extends Document {
  csrf: string;
  user:Types.ObjectId;
  applicationId: string;
  printLink: string;
  status: string;
  otp: string;
  cost: number;
  cookies: string[];

  officeAddressType: string;
  officeAddrCountry: string;
  officeAddrCity: string;
  officeAddrDivision: string;
  officeAddrDistrict: string;
  officeAddrCityCorpCantOrUpazila: string;
  officeAddrPaurasavaOrUnion: string;
  officeAddrWard: string;
  officeAddrOffice: string;

  personInfoForBirth: IPersonInfo;
  father: IParentInfo;
  mother: IParentInfo;

  birthPlaceCountry: string;
  birthPlaceDiv: string;
  birthPlaceDist: string;
  birthPlaceCityCorpCantOrUpazila: string;
  birthPlacePaurasavaOrUnion: string;
  birthPlaceWardInPaurasavaOrUnion: string;
  birthPlaceVilAreaTownBn: string;
  birthPlaceVilAreaTownEn: string;
  birthPlacePostOfc: string;
  birthPlacePostOfcEn: string;
  birthPlaceHouseRoadBn: string;
  birthPlaceHouseRoadEn: string;

  copyBirthPlaceToPermAddr: string;

  permAddrCountry: string;
  permAddrDiv: string;
  permAddrDist: string;
  permAddrCityCorpCantOrUpazila: string;
  permAddrPaurasavaOrUnion: string;
  permAddrWardInPaurasavaOrUnion: string;

  copyPermAddrToPrsntAddr: string;

  prsntAddrCountry: string;
  prsntAddrDiv: string;
  prsntAddrDist: string;
  prsntAddrCityCorpCantOrUpazila: string;
  prsntAddrPaurasavaOrUnion: string;
  prsntAddrWardInPaurasavaOrUnion: string;

  applicantName: string;
  phone: string;
  email?: string;
  relationWithApplicant: string;

  attachments: IAttachment[];

  declaration: string;
  personImage?: string;
}

const AttachmentSchema = new Schema<IAttachment>({
  id: Number,
  name: String,
  type: String,
  size: Number,
});

const ParentSchema = new Schema<IParentInfo>({
  personNameBn: String,
  personNameEn: String,
  personNationality: String,
  personNid: String,
  passportNumber: String,
  ubrn: String,
  personBirthDate: String,
});

const PersonInfoSchema = new Schema<IPersonInfo>({
  personFirstNameBn: String,
  personLastNameBn: String,
  personNameBn: String,
  personFirstNameEn: String,
  personLastNameEn: String,
  personNameEn: String,
  personBirthDate: String,
  thChild: String,
  gender: {
    type: String,
    enum: ["MALE", "FEMALE", "OTHER"],
  },
  religion: String,
  religionOther: String,
  personNid: String,
});

const BirthRegistrationSchema = new Schema<IBirthRegistration>(
  {
    csrf: String,
    otp: String,
    user: { type: Schema.Types.ObjectId, ref: "User" },
    status: { type: String, default: "pending" },
    applicationId: { type: String, default: "" },
    printLink: { type: String, default: "" },
    cost: { type: Number, default: 0 },
    cookies: [String],

    officeAddressType: String,
    officeAddrCountry: String,
    officeAddrCity: String,
    officeAddrDivision: String,
    officeAddrDistrict: String,
    officeAddrCityCorpCantOrUpazila: String,
    officeAddrPaurasavaOrUnion: String,
    officeAddrWard: String,
    officeAddrOffice: String,

    personInfoForBirth: PersonInfoSchema,
    father: ParentSchema,
    mother: ParentSchema,

    birthPlaceCountry: String,
    birthPlaceDiv: String,
    birthPlaceDist: String,
    birthPlaceCityCorpCantOrUpazila: String,
    birthPlacePaurasavaOrUnion: String,
    birthPlaceWardInPaurasavaOrUnion: String,
    birthPlaceVilAreaTownBn: String,
    birthPlaceVilAreaTownEn: String,
    birthPlacePostOfc: String,
    birthPlacePostOfcEn: String,
    birthPlaceHouseRoadBn: String,
    birthPlaceHouseRoadEn: String,

    copyBirthPlaceToPermAddr: String,

    permAddrCountry: String,
    permAddrDiv: String,
    permAddrDist: String,
    permAddrCityCorpCantOrUpazila: String,
    permAddrPaurasavaOrUnion: String,
    permAddrWardInPaurasavaOrUnion: String,

    copyPermAddrToPrsntAddr: String,

    prsntAddrCountry: String,
    prsntAddrDiv: String,
    prsntAddrDist: String,
    prsntAddrCityCorpCantOrUpazila: String,
    prsntAddrPaurasavaOrUnion: String,
    prsntAddrWardInPaurasavaOrUnion: String,

    applicantName: String,
    phone: String,
    email: String,
    relationWithApplicant: String,

    attachments: [AttachmentSchema],

    declaration: String,
    personImage: String,
  },
  { timestamps: true }
);

export default models.BirthRegistration ||
  model<IBirthRegistration>("BirthRegistration", BirthRegistrationSchema);
