import ViewCorrectionPage from "@/components/CurrectionViewPage";
import { connectDB } from "@/lib/mongodb";
import Currection from "@/models/Currection";

interface ICorrectionInfo {
  id: string;
  key: string;
  value: string;
  cause: string;
}

interface ISendData {
  _id: string;
  id: string;
  ubrn: string;
  dob: string;
  applicationId: string;
  currectionInfos: ICorrectionInfo[];
}

export default async function ViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectDB();
  const application = await Currection.findById(id).lean();
  
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
    _id: application._id.toString(),
    id: id,
    ubrn: application.ubrn ? application.ubrn.toString() : '',
    dob: application.dob ? application.dob.toString() : '',
    applicationId: application.applicationId ? application.applicationId.toString() : '',
    currectionInfos: (application.correctionInfos || []).map((info) => ({
      id: info.id?.toString() || '',
      key: info.key?.toString() || '',
      value: info.value?.toString() || '',
      cause: info.cause?.toString() || '',
    })),
  };

  return <ViewCorrectionPage application={sendData} />;
}