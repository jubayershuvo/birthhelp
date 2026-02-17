import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface for type safety
export interface IAddress extends Document {
  user: mongoose.Types.ObjectId;
  address: {
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
  };
}

// Mongoose schema definition
const AddressSchema: Schema = new Schema<IAddress>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  address: {
    country: { type: String },
    geoId: { type: String },
    division: { type: String },
    divisionName: { type: String },
    district: { type: String },
    districtName: { type: String },
    cityCorpCantOrUpazila: { type: String },
    upazilaName: { type: String },
    paurasavaOrUnion: { type: String },
    unionName: { type: String },
    postOfc: { type: String },
    postOfcEn: { type: String },
    vilAreaTownBn: { type: String },
    vilAreaTownEn: { type: String },
    houseRoadBn: { type: String },
    houseRoadEn: { type: String },
    ward: { type: String },
    wardName: { type: String },
  },
});

const AddressPreset =
  mongoose.models.AddressPreset ||
  mongoose.model<IAddress>("AddressPreset", AddressSchema);

export default AddressPreset;
