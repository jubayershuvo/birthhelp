import { Schema, model, models, Document, Types } from "mongoose";

export interface IBirthRegistration extends Document {
  ubrn: string;
  user: Types.ObjectId;
  udrn: string | null;
  uid: string | null;
  securityCode: string | null;

  personBirthDate: string | null;
  personBirthDateString: string | null;

  personDeathDate: string | null;
  dateOfRegistration: string | null;
  dateOfRegistrationString: string | null;

  gender: string | null;

  personNameBn: string | null;
  personNameEn: string | null;

  motherNameBn: string | null;
  motherNameEn: string | null;
  motherNationality: string | null;
  motherNationalityEn: string | null;
  motherNid: string | null;
  motherBrn: string | null;

  fatherNameBn: string | null;
  fatherNameEn: string | null;
  fatherNationality: string | null;
  fatherNationalityEn: string | null;
  fatherNid: string | null;
  fatherBrn: string | null;

  thChild: number | null;

  birthPlaceLocationId: number | null;
  birthPlaceBn: string | null;
  birthPlaceEn: string | null;
  fullBirthPlaceBn: string | null;
  fullBirthPlaceEn: string | null;

  permAddrLocationId: number | null;
  permAddrBn: string | null;
  permAddrBnFromPermAddrLocationId: string | null;
  permAddrEnFromPermAddrLocationId: string | null;
  permAddrEn: string | null;
  fullPermAddrBn: string | null;
  fullPermAddrEn: string | null;

  prsntAddrLocationId: number | null;
  prsntAddrBn: string | null;
  prsntAddrEn: string | null;
  fullPrsntAddrBn: string | null;
  fullPrsntAddrEn: string | null;

  deathAddrLocationId: number | null;
  deathAddrBn: string | null;
  fullDeathAddrBn: string | null;

  causeOfDeath: string | null;

  bookNumber: string | null;
  pageNumber: string | null;
  lineNumber: string | null;

  base64EncodedQrCode: string | null;
  base64EncodedBarcode: string | null;
  checksum: string | null;
  registrationStatus: string | null;

  geoLocationId: number | null;

  wardNo: string | null;
  wardNameBn: string | null;
  wardNameEn: string | null;
  wardId: string | null;

  registrationOfficeName: string | null;
  officeAddress: string | null;
  phone: string | null;
  hiddenPhone: string | null;
  email: string | null;

  birthRegisterId: string | null;

  familyUbrnList: string[] | null;

  messageBn: string | null;
  messageEn: string | null;

  officeAddressBn: string | null;
  officeAddressEn: string | null;

  foreign: boolean;

  searchText: string | null;
}

const BirthRegistrationSchema = new Schema<IBirthRegistration>(
  {
    ubrn: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },

    udrn: { type: String, default: null },
    uid: { type: String, default: null },
    securityCode: { type: String, default: null },

    personBirthDate: { type: String, default: null },
    personBirthDateString: { type: String, default: null },
    personDeathDate: { type: String, default: null },

    dateOfRegistration: { type: String, default: null },
    dateOfRegistrationString: { type: String, default: null },

    gender: { type: String, default: null },

    personNameBn: { type: String, default: null },
    personNameEn: { type: String, default: null },

    motherNameBn: { type: String, default: null },
    motherNameEn: { type: String, default: null },
    motherNationality: { type: String, default: null },
    motherNationalityEn: { type: String, default: null },
    motherNid: { type: String, default: null },
    motherBrn: { type: String, default: null },

    fatherNameBn: { type: String, default: null },
    fatherNameEn: { type: String, default: null },
    fatherNationality: { type: String, default: null },
    fatherNationalityEn: { type: String, default: null },
    fatherNid: { type: String, default: null },
    fatherBrn: { type: String, default: null },

    thChild: { type: Number, default: null },

    birthPlaceLocationId: { type: Number, default: null },
    birthPlaceBn: { type: String, default: null },
    birthPlaceEn: { type: String, default: null },
    fullBirthPlaceBn: { type: String, default: null },
    fullBirthPlaceEn: { type: String, default: null },

    permAddrLocationId: { type: Number, default: null },
    permAddrBn: { type: String, default: null },
    permAddrBnFromPermAddrLocationId: { type: String, default: null },
    permAddrEnFromPermAddrLocationId: { type: String, default: null },
    permAddrEn: { type: String, default: null },
    fullPermAddrBn: { type: String, default: null },
    fullPermAddrEn: { type: String, default: null },

    prsntAddrLocationId: { type: Number, default: null },
    prsntAddrBn: { type: String, default: null },
    prsntAddrEn: { type: String, default: null },
    fullPrsntAddrBn: { type: String, default: null },
    fullPrsntAddrEn: { type: String, default: null },

    deathAddrLocationId: { type: Number, default: null },
    deathAddrBn: { type: String, default: null },
    fullDeathAddrBn: { type: String, default: null },

    causeOfDeath: { type: String, default: null },

    bookNumber: { type: String, default: null },
    pageNumber: { type: String, default: null },
    lineNumber: { type: String, default: null },

    base64EncodedQrCode: { type: String, default: null },
    base64EncodedBarcode: { type: String, default: null },
    checksum: { type: String, default: null },
    registrationStatus: { type: String, default: null },

    geoLocationId: { type: Number, default: null },

    wardNo: { type: String, default: null },
    wardNameBn: { type: String, default: null },
    wardNameEn: { type: String, default: null },
    wardId: { type: String, default: null },

    registrationOfficeName: { type: String, default: null },
    officeAddress: { type: String, default: null },
    phone: { type: String, default: null },
    hiddenPhone: { type: String, default: null },
    email: { type: String, default: null },

    birthRegisterId: { type: String, default: null },

    familyUbrnList: { type: Array, default: null },

    messageBn: { type: String, default: null },
    messageEn: { type: String, default: null },

    officeAddressBn: { type: String, default: "" },
    officeAddressEn: { type: String, default: "" },

    foreign: { type: Boolean, default: false },

    searchText: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

export default models.BdrisData ||
  model<IBirthRegistration>("BdrisData", BirthRegistrationSchema);
