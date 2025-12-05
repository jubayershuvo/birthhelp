import ViewCorrectionPage from "@/components/RegisterViewPage";
import { connectDB } from "@/lib/mongodb";
import BirthRegistration, { IBirthRegistration } from "@/models/BirthRegistration";




interface ISendData {
  id: string;
  dob: string;
  applicationId: string;
  lastDate: string
}

export default async function ViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();
  const application = await BirthRegistration.findById(new Object(id)).lean() as unknown as IBirthRegistration;
  
  if (!application) {
    // For page components, you should return JSX, not NextResponse
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Application Not Found</h1>
          <p className="text-gray-600 mt-2">The requested correction application could not be found.</p>
        </div>
      </div>
    );
  }

  // Properly serialize the data to plain objects
  const sendData: ISendData = {
    id: id,
    dob: application.personInfoForBirth.personBirthDate,
    applicationId: application.applicationId,
    lastDate: application.lastDate

  };

  return <ViewCorrectionPage application={sendData} />;
}