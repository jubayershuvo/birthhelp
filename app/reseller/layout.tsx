import type { Metadata } from "next";
import ResellerNav from "@/components/reseller/Nav";

export const metadata: Metadata = {
  title: "Bdris- Reseller",
  description: "BDRIS - Reseller",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ResellerNav>{children}</ResellerNav>;
}
