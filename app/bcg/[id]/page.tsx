import BirthCertificateGenerator from "@/components/BirthCertificateGenerator";
import { generateBarcode, generateQRCode } from "@/lib/genImage";
import { connectDB } from "@/lib/mongodb";
import BirthCertificate from "@/models/BirthCertificate";
import { ObjectId } from "mongodb";

// Define the complete certificate data interface based on your Mongoose schema
interface CertificateData {
  _id: ObjectId;
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
  createdAt?: string;
  updatedAt?: string;
}

// Define the props interface
interface BirthCertificateGeneratorPageProps {
  params: Promise<{ id: string }>;
}

// Define the processed certificate interface for the component
interface ProcessedCertificate extends Omit<CertificateData, '_id'> {
  _id: string;
  qrCode: string;
  barCode: string;
}

export default async function BirthCertificateGeneratorPage({
  params,
}: BirthCertificateGeneratorPageProps) {
  try {
    const { id } = await params;
    if (!id) {
      return <div>Missing id parameter</div>;
    }
    await connectDB();

    // Convert Mongoose document to plain object
    const data = await BirthCertificate.findById(id).lean() as CertificateData | null;

    if (!data) {
      return <div>Certificate not found</div>;
    }

    if (!data.qrCodeData || !data.barcodeData || !data.birthRegNumber) {
      return <div>Invalid data</div>;
    }

    const qrCode = await generateQRCode(data.qrCodeData);
    const barCode = generateBarcode(data.barcodeData);

    if (!qrCode || !barCode) {
      return <div>Failed to generate QR code or bar code</div>;
    }

    // Create a properly typed certificate object
    const certificate: ProcessedCertificate = {
      ...data,
      _id: data._id.toString(),
      qrCode: qrCode,
      barCode: barCode,
    };

    return <BirthCertificateGenerator certificateData={certificate} />;
  } catch (error) {
    console.error("Error generating birth certificate:", error);
    return <div>Error 500</div>;
  }
}