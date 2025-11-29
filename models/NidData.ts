import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAddress {
  division: string;
  district: string;
  rmo: string;
  city_corporation_or_municipality: string;
  upozila: string;
  union_ward: string;
  mouza_moholla: string;
  additional_mouza_moholla: string;
  ward_for_union_porishod: string;
  village_road: string;
  additional_village_road: string;
  home_holding_no: string;
  post_office: string;
  postal_code: string;
  region: string;
}

export interface INidData extends Document {
  citizen_status: string;
  user: Types.ObjectId;
  signature: string;
  photo: string;
  nid: string;
  pincode: string;
  barcode: string;
  status: string;
  afis_status: string;
  lock_flag: string;
  voter_no: string;
  form_no: string;
  sl_no: string;
  tag: string;
  name_bn: string;
  name_en: string;
  dob: string;
  birth_place: string;
  birth_other: string;
  birth_reg_no: string;
  father_name: string;
  mother_name: string;
  spouse_name: string;
  gender: string;
  marital_status: string;
  occupation: string;
  disability: string;
  disability_other: string;
  present_address: IAddress;
  permanent_address: IAddress;
  education: string;
  blood_group: string;
  religion: string;
  present_address_full: string;
  permanent_address_full: string;
  addresses_same: boolean;
  tin: string;
  driving_lic: string;
  passport: string;
  laptop_id: string;
  father_nid: string;
  mother_nid: string;
  spouse_nid: string;
  father_voter_no: string;
  mother_voter_no: string;
  spouse_voter_no: string;
  phone: string;
  mobile: string;
  email: string;
  religion_other: string;
  father_death_date: string;
  mother_death_date: string;
  spouse_death_date: string;
  no_finger: number;
  no_finger_print: number;
  voter_area: string;
  voter_at: string;
}

const AddressSchema: Schema = new Schema({
  division: String,
  district: String,
  rmo: String,
  city_corporation_or_municipality: String,
  upozila: String,
  union_ward: String,
  mouza_moholla: String,
  additional_mouza_moholla: String,
  ward_for_union_porishod: String,
  village_road: String,
  additional_village_road: String,
  home_holding_no: String,
  post_office: String,
  postal_code: String,
  region: String,
});

const NidDataSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User" },
  citizen_status: String,
  nid: String,
  signature: String,
  photo: String,
  pincode: String,
  barcode: String,
  status: String,
  afis_status: String,
  lock_flag: String,
  voter_no: String,
  form_no: String,
  sl_no: String,
  tag: String,
  name_bn: String,
  name_en: String,
  dob: String,
  birth_place: String,
  birth_other: String,
  birth_reg_no: String,
  father_name: String,
  mother_name: String,
  spouse_name: String,
  gender: String,
  marital_status: String,
  occupation: String,
  disability: String,
  disability_other: String,
  present_address: AddressSchema,
  permanent_address: AddressSchema,
  education: String,
  blood_group: String,
  religion: String,
  present_address_full: String,
  permanent_address_full: String,
  addresses_same: Boolean,
  tin: String,
  driving_lic: String,
  passport: String,
  laptop_id: String,
  father_nid: String,
  mother_nid: String,
  spouse_nid: String,
  father_voter_no: String,
  mother_voter_no: String,
  spouse_voter_no: String,
  phone: String,
  mobile: String,
  email: String,
  religion_other: String,
  father_death_date: String,
  mother_death_date: String,
  spouse_death_date: String,
  no_finger: Number,
  no_finger_print: Number,
  voter_area: String,
  voter_at: String,
});

export default mongoose.models.NidData || mongoose.model<INidData>("NidData", NidDataSchema);
