import { NextResponse } from "next/server";
import BirthCertificate from "@/models/BirthCertificate";
import { connectDB } from "@/lib/mongodb";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const body = await req.json();
    const { id } = await params;
    const doc = await BirthCertificate.findById(id);
    if (!doc) {
      return NextResponse.json(
        { success: false, message: "Birth certificate not found" },
        { status: 404 }
      );
    }
    
    if(body.personNameBn){
      doc.personNameBn = body.personNameBn;
    }

    if(body.personNameEn){
      doc.personNameEn = body.personNameEn;
    }

    if(body.birthPlaceBn){
      doc.birthPlaceBn = body.birthPlaceBn;
    }

    if(body.birthPlaceEn){
      doc.birthPlaceEn = body.birthPlaceEn;
    }

    if(body.motherNameBn){
      doc.motherNameBn = body.motherNameBn;
    }

    if(body.motherNameEn){
      doc.motherNameEn = body.motherNameEn;
    }

    if(body.motherNationalityBn){
      doc.motherNationalityBn = body.motherNationalityBn;
    }

    if(body.motherNationalityEn){
      doc.motherNationalityEn = body.motherNationalityEn;
    }

    if(body.fatherNameBn){
      doc.fatherNameBn = body.fatherNameBn;
    }

    if(body.fatherNameEn){
      doc.fatherNameEn = body.fatherNameEn;
    }

    if(body.fatherNationalityBn){
      doc.fatherNationalityBn = body.fatherNationalityBn;
    }

    if(body.fatherNationalityEn){
      doc.fatherNationalityEn = body.fatherNationalityEn;
    }

    if(body.permanentAddressBn){
      doc.permanentAddressBn = body.permanentAddressBn;
    }

    if(body.permanentAddressEn){
      doc.permanentAddressEn = body.permanentAddressEn;
    }

    if(body.dateInWords){
      doc.dateInWords = body.dateInWords;
    }
    if(body.sex){
      doc.sex = body.sex;
    }
    if(body.dateOfBirth){
      doc.dateOfBirth = body.dateOfBirth;
    }

    if(body.registrationOffice){
      doc.registrationOffice = body.registrationOffice;
    }
    if(body.officeLocation){
      doc.officeLocation = body.officeLocation;
    }
  



    await doc.save();


    const updatedDoc = await BirthCertificate.findById(id);

    return NextResponse.json({
      success: true,
      message: "Birth certificate updated successfully",
      data: updatedDoc,
    });
  } catch (error) {
    console.error("Error updating birth certificate:", error);
    return NextResponse.json(
      { success: false, message: "Server error", details: error },
      { status: 500 }
    );
  }
}
