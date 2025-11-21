import WalletPage from "@/components/reseller/Wallet";
import { connectDB } from "@/lib/mongodb";

export default async function ResellerWallet() {
    const db = await connectDB();
    const data = await db.collection("datas").findOne();
    const walletData = {
        percentage: data?.percentage
    }
    return <WalletPage data={walletData} />
}