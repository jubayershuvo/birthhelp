import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import NidData from "@/models/NidData";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Buffer } from "buffer";
import { generateNidBarcode } from "@/lib/genImage";
import axios from "axios";

interface IAddress {
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

export async function POST(req: Request) {
  try {
    await connectDB();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const formDataBody = await req.formData();
    const profilePdf = formDataBody.get("profile_pdf") as File | null;

    if (!profilePdf) {
      console.error("Error: PDF file not found in request.");
      return NextResponse.json(
        { error: "PDF file not found" },
        { status: 400 },
      );
    }

    // Send PDF to first server
    let pdfResponse;
    try {
      const formData = new FormData();
      formData.append("pdf", profilePdf);
      formData.append("key", process.env.BADSAINFO_KEY!);
      pdfResponse = await fetch("https://badsainfo.xyz/sm/sinetonid.php", {
        method: "POST",
        body: formData,
      });
    } catch (fetchError) {
      console.error("Failed to send PDF to server:", fetchError);
      return NextResponse.json(
        { error: "Failed to send PDF to server", details: fetchError },
        { status: 502 },
      );
    }

    if (!pdfResponse.ok) {
      return NextResponse.json(
        {
          error: "Failed to send PDF to server",
          details: pdfResponse.statusText,
        },
        { status: 502 },
      );
    }
    let pdfResult;

    try {
      pdfResult = await pdfResponse.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: "Invalid JSON response from server", details: jsonError },
        { status: 502 },
      );
    }

    function formatDate(dateStr: string): string {
      const date = new Date(dateStr);

      const day = date.toLocaleString("en-US", { day: "2-digit" });
      const month = date.toLocaleString("en-US", { month: "short" });
      const year = date.getFullYear();

      return `${day} ${month} ${year}`; // No comma
    }

    const barcodeData = `<pin>${pdfResult.data.pin}</pin><name>${
      pdfResult.data.nameEnglish
    }</name><DOB>${formatDate(
      pdfResult.data.dateOfBirth,
    )}</DOB><FP></FP><F>Right Index</F><TYPE>A</TYPE><V>2.0</V><ds>302c02167da6b272e960dfaf8a7ccca6b031da99defe8d24c44882580f7a9b3fea93b99040f65c34e8edafe9de63</ds>`;
    // Save data to MongoDB

    const nidData = new NidData({
      ...pdfResult.data,
      name_bn: pdfResult.data.nameBangla,
      name_en: pdfResult.data.nameEnglish,
      nid: pdfResult.data.nationalId,
      pincode: pdfResult.data.pin,
      father_name: pdfResult.data.fatherName,
      mother_name: pdfResult.data.motherName,
      blood_group: pdfResult.data.bloodGroup,
      birth_place: pdfResult.data.birthPlace,
      dob: pdfResult.data.dateOfBirth,
      present_address_full: pdfResult.data.address,
      permanent_address_full: pdfResult.data.address,
    });
    const nid = await nidData.save();

    const id = nid._id.toString();
    const photoUrl = pdfResult.data.userIMG;
    const signUrl = pdfResult.data.signIMG;
    const imageDirPath = path.join(process.cwd(), "upload", "images", id);
    if (!fs.existsSync(imageDirPath))
      fs.mkdirSync(imageDirPath, { recursive: true });

    async function urlToBuffer(photoUrl: string) {
      const response = await axios.get(photoUrl, {
        responseType: "arraybuffer",
      });
      return Buffer.from(response.data, "binary");
    }

    // usage
    const photoBuffer = await urlToBuffer(photoUrl);
    const signatureBuffer = await urlToBuffer(signUrl);
    const barCodeBuffer = await generateNidBarcode(barcodeData);

    const photoPath = path.join(imageDirPath, "photo.png");
    const signaturePath = path.join(imageDirPath, "signature.png");
    const barCodePath = path.join(imageDirPath, "barCode.png");

    fs.writeFileSync(photoPath, photoBuffer);
    fs.writeFileSync(signaturePath, signatureBuffer);
    if (barCodeBuffer) fs.writeFileSync(barCodePath, barCodeBuffer);

    nid.photo = photoPath;
    nid.signature = signaturePath;
    nid.barcode = barCodePath;
    await nid.save();

    return NextResponse.json(nid, { status: pdfResponse.status });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 },
    );
  }
}
