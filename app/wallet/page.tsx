import WalletPage from "@/components/Wallet";
import { connectDB } from "@/lib/mongodb";

export default async function Wallet() {
    const db = await connectDB();
    const data = await db.collection("datas").findOne();

    const walletData = {
        bkash: data?.bkash,
    }
    return <WalletPage data={walletData} />
}