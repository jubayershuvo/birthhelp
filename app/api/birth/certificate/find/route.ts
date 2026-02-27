import { getUser } from "@/lib/getUser";
import { connectDB } from "@/lib/mongodb";
import BirthCertificate from "@/models/BirthCertificate";
import Services from "@/models/Services";
import { NextResponse } from "next/server";

interface RequestBody {
  ubrn: string;
  dob: string;
  session_id: string;
  captcha_answer: string;
}

const qrArray = [
  {
    randomCode: "HTQHD",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=2xUHg9QeuB/IEOjVjIJcECUvKEM+T+vJ3XzbgdEqmree89Hrqh2uuig9dFrwnCRT",
    verificationKey:
      "2xUHg9QeuB/IEOjVjIJcECUvKEM+T+vJ3XzbgdEqmree89Hrqh2uuig9dFrwnCRT",
  },
  {
    randomCode: "QZTA",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=s2BcWgd8fbtnicusvrzZcKc50U20jvpzgQzIQoEiAB4CvNJWQ6Ryd8EJESr7I72o",
    verificationKey:
      "s2BcWgd8fbtnicusvrzZcKc50U20jvpzgQzIQoEiAB4CvNJWQ6Ryd8EJESr7I72o",
  },
  {
    randomCode: "RQHM",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=vxpK8LGVpClCCdIQ8Fci76NLo+asTHGygByJWfEIChsaIxH+3osFJs0ocgttN6Eq",
    verificationKey:
      "vxpK8LGVpClCCdIQ8Fci76NLo+asTHGygByJWfEIChsaIxH+3osFJs0ocgttN6Eq",
  },
  {
    randomCode: "AMZQ",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=GfXt+Frp1jJ9fdyMon2MUq+QTEGkrkO94FHmEjCn/hjDU8901YcPEbAQ0nJg/MK/",
    verificationKey:
      "GfXt+Frp1jJ9fdyMon2MUq+QTEGkrkO94FHmEjCn/hjDU8901YcPEbAQ0nJg/MK/",
  },
  {
    randomCode: "ZRDZM",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=bauhOoqThEgCwT8II5cBrTqUxZrvVApS/cLEcVod8cUH2OvIPozZij231+DlEPA+",
    verificationKey:
      "bauhOoqThEgCwT8II5cBrTqUxZrvVApS/cLEcVod8cUH2OvIPozZij231+DlEPA+",
  },
  {
    randomCode: "ZRHMQ",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=2gLrule/lt40q+6fC/P8ot6w6Sk7y/Z1d7/EIcUFwcemLvA/kIMPUt4v6TEyWdln",
    verificationKey:
      "2gLrule/lt40q+6fC/P8ot6w6Sk7y/Z1d7/EIcUFwcemLvA/kIMPUt4v6TEyWdln",
  },
  {
    randomCode: "QMMQ",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=PoPgFlw+Hh1x8DrUxNiBq8tjwa27QXL9jbJhzj/O7PmowjENwAEoSS48jpzKCj1V",
    verificationKey:
      "PoPgFlw+Hh1x8DrUxNiBq8tjwa27QXL9jbJhzj/O7PmowjENwAEoSS48jpzKCj1V",
  },
  {
    randomCode: "ZHHHH",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=sOw10tpCRv07n4agn4eVd8IMwDt+Sao+AjA+FjReQOEVeGCEaqdgKRZXmP2u7I4w",
    verificationKey:
      "sOw10tpCRv07n4agn4eVd8IMwDt+Sao+AjA+FjReQOEVeGCEaqdgKRZXmP2u7I4w",
  },
  {
    randomCode: "ZERQE",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=Y0CGrmg/vAYC0LnSCODx6Ph041jNDbKpykFpx028QUigJPwgOF7QCQzhY7J+h3/f",
    verificationKey:
      "Y0CGrmg/vAYC0LnSCODx6Ph041jNDbKpykFpx028QUigJPwgOF7QCQzhY7J+h3/f",
  },
  {
    randomCode: "RRTZ",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=vTIyCb8Nq4Sgc+K5Ab8BkpRo9psWttQzV9/mvFhxXsZ4fEnA5NUbfAUU3I07S/kV",
    verificationKey:
      "vTIyCb8Nq4Sgc+K5Ab8BkpRo9psWttQzV9/mvFhxXsZ4fEnA5NUbfAUU3I07S/kV",
  },
  {
    randomCode: "DQHI",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=ninkByli/C7RMUXkemqvs06H/wP9M8c5LclyGHdLvnXpRjx68+QXqLML5CPsrjuL",
    verificationKey:
      "ninkByli/C7RMUXkemqvs06H/wP9M8c5LclyGHdLvnXpRjx68+QXqLML5CPsrjuL",
  },
  {
    randomCode: "ZTTQE",
    qrCodeData:
      "https://bdris.gov.bd/certificate/verify?key=OQ7Jnx+kSV3RrNr4BgaNGm3cO+0ij7ET1boWyRVjhSUwFOWPMrG0pi/jEiNEJU0M",
    verificationKey:
      "OQ7Jnx+kSV3RrNr4BgaNGm3cO+0ij7ET1boWyRVjhSUwFOWPMrG0pi/jEiNEJU0M",
  },
];
function formatDate(input: string): string {
  const date = new Date(input);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

function dateToWords(dateStr: string): string {
  if (!dateStr) return "";

  let dd = 0,
    mm = 0,
    yyyy = 0;

  // ---------- FORMAT 1: DD/MM/YYYY ----------
  if (dateStr.includes("/")) {
    const parts = dateStr.split("/");
    if (parts.length !== 3) return "";

    [dd, mm, yyyy] = parts.map(Number);
  }

  // ---------- FORMAT 2: DD Month YYYY ----------
  else {
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length !== 3) return "";

    dd = Number(parts[0]);
    yyyy = Number(parts[2]);

    const monthMap: Record<string, number> = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
    };

    mm = monthMap[parts[1].toLowerCase()];
  }

  if (!dd || !mm || !yyyy) return "";

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const ordinals = [
    "",
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
    "Eighth",
    "Ninth",
    "Tenth",
    "Eleventh",
    "Twelfth",
    "Thirteenth",
    "Fourteenth",
    "Fifteenth",
    "Sixteenth",
    "Seventeenth",
    "Eighteenth",
    "Nineteenth",
    "Twentieth",
    "Twenty First",
    "Twenty Second",
    "Twenty Third",
    "Twenty Fourth",
    "Twenty Fifth",
    "Twenty Sixth",
    "Twenty Seventh",
    "Twenty Eighth",
    "Twenty Ninth",
    "Thirtieth",
    "Thirty First",
  ];

  function yearToWords(year: number): string {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];

    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const thousand = Math.floor(year / 1000);
    const hundred = Math.floor((year % 1000) / 100);
    const lastTwo = year % 100;

    let result = "";

    if (thousand) {
      result += `${ones[thousand]} Thousand `;
    }

    if (hundred) {
      result += `${ones[hundred]} Hundred `;
    }

    if (lastTwo) {
      if (lastTwo < 10) {
        result += ones[lastTwo];
      } else if (lastTwo < 20) {
        result += teens[lastTwo - 10];
      } else {
        result += `${tens[Math.floor(lastTwo / 10)]} ${
          ones[lastTwo % 10]
        }`.trim();
      }
    }

    return result.trim();
  }

  return `${ordinals[dd]} of ${months[mm - 1]} ${yearToWords(yyyy)}`;
}

function toISO(dateStr: string): string {
  const [dd, mm, yyyy] = dateStr.split("/");
  return `${yyyy}-${mm.padStart(2,"0")}-${dd.padStart(2,"0")}`;
}

export async function POST(req: Request) {
  try {
    const { ubrn, dob, session_id, captcha_answer }: RequestBody =
      await req.json();

    if (!ubrn || !dob) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    const servicePath = "/birth/certificate";

    const service = await Services.findOne({ href: servicePath });
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 },
      );
    }

    const userService = user.services.find(
      (s: { service: string }) =>
        s.service.toString() === service._id.toString(),
    );

    if (!userService) {
      return NextResponse.json(
        { success: false, error: "User does not have access to this service" },
        { status: 403 },
      );
    }
    const serviceCost = user.isSpecialUser
      ? userService.fee
      : userService.fee + service.fee;

    const response = await fetch(
      "https://my.applicationzone.top/api/birth_test/verify_birth.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: session_id,
          ubrn,
          birth_date: toISO(dob),
          captcha_answer: captcha_answer,
        }),
      },
    );

    const qr = qrArray
      ? qrArray[Math.floor(Math.random() * qrArray.length)]
      : null;

    const jsonData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: jsonData.message || "Failed to fetch data" },
        { status: response.status },
      );
    }
    const cerData = {
      ...qr,
      ...jsonData.data,
      barcodeData: jsonData.data.birthRegNumber,
      dateInWords: dateToWords(jsonData.data.dateOfBirth),
      registrationDate: formatDate(jsonData.data.registrationDate),
      issuanceDate: formatDate(jsonData.data.issuanceDate),
    };

    const certificate = await BirthCertificate.create(cerData);

    const sendData = {
      _id: certificate._id,
      birthRegNumber: certificate.birthRegNumber,
      personNameEn: certificate.personNameEn,
      personNameBn: certificate.personNameBn,
      dateOfBirth: certificate.dateOfBirth,
      cost: serviceCost,
      note: service.note,
    };

    return NextResponse.json({ success: true, data: sendData });
  } catch (error) {
    console.log(error);
    const message = error instanceof Error ? error.message : "Server Error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
