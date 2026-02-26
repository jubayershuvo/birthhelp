import CorrectionDetailsPage from "@/components/admin/CurrectionSub";

export default async function CurrectionApplicationReqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <CorrectionDetailsPage params={{ id }} />;
}
