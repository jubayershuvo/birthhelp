import ShortData from "@/components/ShortData";

export default async function BCPage({
  params,
}: {
  params: Promise<{ ubrn: string }>;
}) {
  const { ubrn } = await params;
  const url = `https://api.sheva247.site/birth_test/api/birth_verification_get.php?ubrn=${ubrn}`;
  let data;
  let retryCount = 0;
  const maxRetries = 3;
  while (!data?.data && retryCount < maxRetries) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error fetching birth data: ${response.status} ${response.statusText}`);
      }
      data = await response.json();
    } catch (error) {
      console.error("Error fetching birth data:", error);
      retryCount++;
    }
  }

  if (!data?.data) {
    return <div>No data found for UBRN: {ubrn}</div>;
  }

  return <ShortData data={data.data} />;
}
