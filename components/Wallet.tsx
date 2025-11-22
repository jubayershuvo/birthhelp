"use client";
import React, { useEffect, useState } from "react";
import {
  Copy,
  Check,
  Wallet,
  Send,
  History,
  ArrowDownCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { updateUser } from "@/lib/userSlice";
import toast from "react-hot-toast";

// Define types for better TypeScript support
type FormData = {
  trxId: string;
};

type Transaction = {
  _id: number;
  trxId: string;
  amount: number;
  method: string;
  status: string;
  date: string;
};

export default function WalletPage() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<{ bkash: string }>({ bkash: "" });
  const { user } = useAppSelector((state) => state.userAuth);
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<FormData>({
    trxId: "",
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const fetctData = async () => {
    try {
      const response = await fetch("/api/data");
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetctData();
  }, []);

  const bkashNumber = data.bkash;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bkashNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Fixed handleInputChange with proper typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Type guard to ensure name is a valid key of FormData
    if (name in formData) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async () => {
    if (formData.trxId) {
      try {
        toast.loading("Depositing...", { id: "deposit" });
        const res = await fetch("/api/deposit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (res.ok) {
          setTransactions(data.transactions || []);
          dispatch(updateUser(data.user));
          setFormData({ trxId: "" });
          setShowDepositModal(false);
          toast.success("Deposit successful", {
            id: "deposit",
          });
        } else {
          toast.error(data.error || data.message, {
            id: "deposit",
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions");
      const data = await response.json();
      setTransactions(data.transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 dark:bg-purple-900 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 dark:bg-blue-900 rounded-full blur-3xl opacity-40 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 dark:bg-pink-900 rounded-full blur-3xl opacity-20 animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-md opacity-50"></div>
            <Wallet className="w-8 h-8 text-purple-600 dark:text-purple-400 relative" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-lg">
            আমার ওয়ালেট
          </h1>
        </div>

        {/* Balance Card - Matched to withdraw page */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-8 shadow-2xl mb-6 transform group-hover:scale-105 transition duration-300 border border-purple-400/30">
            <p className="text-purple-100 text-sm mb-2 font-medium">
              মোট ব্যালেন্স
            </p>
            <h2 className="text-5xl font-bold text-white mb-2 tracking-tight">
              ৳ {user.balance.toLocaleString("bn-BD")}
            </h2>
            <p className="text-purple-100 text-sm font-light">বাংলাদেশ টাকা</p>

            {/* Animated pulse effect */}
            <div className="absolute top-4 right-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full absolute top-0"></div>
            </div>
          </div>
        </div>

        {/* Deposit Button - Green theme like withdraw page */}
        {bkashNumber && (
          <button
            onClick={() => setShowDepositModal(true)}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 hover:scale-105 dark:shadow-green-500/10"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition duration-1000"></div>
            <ArrowDownCircle className="w-6 h-6 relative z-10" />
            <span className="relative z-10">টাকা জমা দিন</span>
          </button>
        )}
      </div>

      {/* Enhanced Deposit Modal - Matched to withdraw modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto pt-20">
          <div className="relative max-w-lg w-full">
            {/* Modal Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-4xl blur-xl transform -translate-y-2 scale-105"></div>

            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-green-500/30 dark:border-green-500/20 overflow-hidden">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="flex items-center justify-between relative z-10">
                  <h2 className="text-2xl font-bold drop-shadow-lg">
                    bKash দিয়ে টাকা জমা দিন
                  </h2>
                  <button
                    onClick={() => setShowDepositModal(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Enhanced Steps */}
                <div className="space-y-4">
                  <h3 className="text-gray-900 dark:text-white font-bold text-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    ধাপসমূহ:
                  </h3>

                  <div className="grid gap-3">
                    {[
                      {
                        step: "১",
                        title: "আমাদের bKash নম্বর কপি করুন",
                        desc: "নিচের নম্বরে ক্লিক করুন",
                      },
                      {
                        step: "২",
                        title: "bKash অ্যাপ খুলুন",
                        desc: "আপনার ফোনে bKash অ্যাপ খুলুন",
                      },
                      {
                        step: "৩",
                        title: '"Payment" নির্বাচন করুন',
                        desc: "বিকাশ মেনু থেকে পাঠান অপশন বেছে নিন",
                      },
                      {
                        step: "৪",
                        title: "বিস্তারিত পূরণ করুন এবং পাঠান",
                        desc: "নম্বর এবং পরিমাণ ঠিক করে পাঠিয়ে দিন",
                      },
                      {
                        step: "৫",
                        title: "নিচে বিস্তারিত পূরণ করুন",
                        desc: "লেনদেন সম্পর্কিত তথ্য দিন",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-green-500/30 dark:hover:border-green-500/30 transition duration-300 group"
                      >
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 shadow-lg group-hover:scale-110 transition duration-300">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white font-semibold text-sm">
                            {item.title}
                          </p>
                          <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced bKash Number Copy Section */}
                <div className="relative group/copy">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-2xl blur-md group-hover/copy:blur-lg transition duration-500"></div>
                  <div className="relative bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-2xl p-5 backdrop-blur-sm">
                    <p className="text-white text-sm mb-3 font-medium">
                      আমাদের bKash নম্বর (Payment Number):
                    </p>
                    <button
                      onClick={copyToClipboard}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover/copy:translate-x-[100%] transition duration-1000"></div>
                      <span className="text-xl font-mono tracking-wider relative z-10">
                        {bkashNumber}
                      </span>
                      {copied ? (
                        <Check className="w-5 h-5 relative z-10 animate-bounce" />
                      ) : (
                        <Copy className="w-5 h-5 relative z-10" />
                      )}
                    </button>
                    {copied && (
                      <p className="text-green-400 text-sm mt-3 text-center font-semibold animate-pulse">
                        ✓ কপি করা হয়েছে!
                      </p>
                    )}
                  </div>
                </div>

                {/* Enhanced Form */}
                <div className="space-y-5">
                  {[
                    {
                      label: "লেনদেন ID (TRX ID) *",
                      name: "trxId",
                      type: "text",
                      placeholder: "যেমন: TRX202501201",
                    },
                  ].map((field, index) => (
                    <div key={field.name} className="group">
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof FormData]}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-4 rounded-xl border border-gray-300 dark:border-gray-600 focus:border-green-500 outline-none transition duration-300 focus:bg-white dark:focus:bg-gray-700 focus:shadow-lg focus:shadow-green-500/10 group-hover:border-gray-400 dark:group-hover:border-gray-500"
                      />
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={!formData.trxId}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition duration-1000"></div>
                      <span className="relative z-10">জমা দিন</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowDepositModal(false);
                        setFormData({ trxId: "" });
                      }}
                      className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white font-bold py-4 rounded-xl transition duration-300 border border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Transactions Section - Matched to withdraw history */}
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur opacity-50"></div>
            <History className="w-6 h-6 text-purple-600 dark:text-purple-400 relative" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white drop-shadow-lg">
            লেনদেনের ইতিহাস
          </h2>
        </div>

        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((trx) => (
              <div key={trx._id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group-hover:border-green-500/30 dark:group-hover:border-green-500/30 rounded-2xl p-5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-green-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur-md group-hover:blur-lg transition duration-500"></div>
                        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-3 shadow-lg">
                          <Send className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-semibold">
                          {trx.method}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-xs font-medium">
                          ID: {trx.trxId} • {trx.date}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-900 dark:text-white font-bold text-lg">
                        ৳ {trx.amount.toLocaleString("bn-BD")}
                      </p>
                      <p
                        className={`text-xs font-semibold px-3 py-1 rounded-full inline-block mt-1 ${
                          trx.status === "SUCCESS"
                            ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                            : trx.status === "REJECTED"
                            ? "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30"
                            : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {trx.status === "SUCCESS" && "সফল"}
                        {trx.status === "PENDING" && "মুলতুবি"}
                        {trx.status === "REJECTED" && "বাতিল"}
                      </p>
                    </div>
                  </div>

                  {/* Hover effect line */}
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-600 group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              লেনদেনের ইতিহাস পাওয়া যায়নি
            </div>
            <div className="text-gray-400 dark:text-gray-500 text-sm">
              এখনো কোন লেনদেন করা হয়নি
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
