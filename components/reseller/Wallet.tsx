"use client";
import React, { useEffect, useState } from "react";
import {
  Wallet,
  Send,
  History,
  ArrowUpCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { updateUser } from "@/lib/userSlice";
import toast from "react-hot-toast";
import { resellerLogin } from "@/lib/resellerSlice";

// Define types for better TypeScript support
type FormData = {
  amount: string;
  number: string;
};

type Withdrawal = {
  _id: number;
  amount: number;
  fee: number;
  method: string;
  number: string;
  status: string;
  note: string;
  createdAt: string;
};

export default function WalletPage({ data }: { data: { percentage: number } }) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { reseller } = useAppSelector((state) => state.resellerAuth);
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<FormData>({
    amount: "",
    number: "",
  });

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

  const feePercentage = data.percentage || 0; // Default to 1.5% if not provided

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateFee = (amount: number): number => {
    const fee = (amount * feePercentage) / 100;
    return Math.ceil(fee); // Round up to nearest integer
  };

  const calculateNetAmount = (amount: number): number => {
    const fee = calculateFee(amount);
    return amount + fee;
  };

  const handleSubmit = async () => {
    if (formData.amount && formData.number) {
      const amount = parseFloat(formData.amount);
      const fee = calculateFee(amount);

      // Validation
      if (amount < 50) {
        toast.error("ন্যূনতম উত্তোলনের পরিমাণ ৫০ টাকা", { id: "withdraw" });
        return;
      }

      if (amount > reseller.balance) {
        toast.error("পর্যাপ্ত ব্যালেন্স নেই", { id: "withdraw" });
        return;
      }

      // Validate Bangladesh phone number
      const phoneRegex = /^(01[3-9]\d{8})$/;
      if (!phoneRegex.test(formData.number)) {
        toast.error("সঠিক bKash নম্বর দিন (01XXXXXXXXX)", { id: "withdraw" });
        return;
      }

      try {
        toast.loading("উত্তোলন প্রক্রিয়া করা হচ্ছে...", { id: "withdraw" });
        const res = await fetch("/api/reseller/withdraw", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amount,
            fee: fee,
            method: "bkash",
            number: formData.number,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setWithdrawals(data.withdrawals || []);
          dispatch(resellerLogin(data.reseller));
          setFormData({ amount: "", number: "" });
          setShowWithdrawModal(false);
          toast.success("উত্তোলন রিকোয়েস্ট সফলভাবে জমা হয়েছে", {
            id: "withdraw",
          });
        } else {
          toast.error(data.error || data.message, {
            id: "withdraw",
          });
        }
      } catch (error) {
        console.log(error);
        toast.error("নেটওয়ার্ক ত্রুটি হয়েছে", { id: "withdraw" });
      }
    } else {
      toast.error("সমস্ত তথ্য পূরণ করুন", { id: "withdraw" });
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await fetch("/api/reseller/withdrawals");
      const data = await response.json();
      setWithdrawals(data.withdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const currentAmount = parseFloat(formData.amount) || 0;
  const fee = calculateFee(currentAmount);
  const netAmount = calculateNetAmount(currentAmount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500 rounded-full blur-3xl opacity-10 animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="max-w-2xl mx-auto mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur-md opacity-50"></div>
            <Wallet className="w-8 h-8 text-purple-300 relative" />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">
            আমার ওয়ালেট
          </h1>
        </div>

        {/* Balance Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-1000"></div>
          <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 shadow-2xl mb-6 transform group-hover:scale-105 transition duration-300 border border-purple-400/30">
            <p className="text-purple-100 text-sm mb-2 font-medium">
              মোট ব্যালেন্স
            </p>
            <h2 className="text-5xl font-bold text-white mb-2 tracking-tight">
              ৳ {reseller.balance.toLocaleString("bn-BD")}
            </h2>
            <p className="text-purple-100 text-sm font-light">বাংলাদেশ টাকা</p>

            {/* Animated pulse effect */}
            <div className="absolute top-4 right-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
              <div className="w-3 h-3 bg-green-400 rounded-full absolute top-0"></div>
            </div>
          </div>
        </div>

        {/* Withdraw Button */}
        <button
          onClick={() => setShowWithdrawModal(true)}
          className="w-full relative group overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl hover:shadow-green-500/25 hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition duration-1000"></div>
          <ArrowUpCircle className="w-6 h-6 relative z-10" />
          <span className="relative z-10">bKash এ উত্তোলন করুন</span>
        </button>
      </div>

      {/* Enhanced Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-md flex items-start justify-center p-4 z-50 overflow-y-auto pt-20">
          <div className="relative max-w-lg w-full">
            {/* Modal Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-4xl blur-xl transform -translate-y-2 scale-105"></div>

            <div className="relative bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-500/30 overflow-hidden">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

                <div className="flex items-center justify-between relative z-10">
                  <h2 className="text-2xl font-bold drop-shadow-lg">
                    bKash এ উত্তোলন করুন
                  </h2>
                  <button
                    onClick={() => setShowWithdrawModal(false)}
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
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    উত্তোলনের শর্তাবলী:
                  </h3>

                  <div className="grid gap-3">
                    {[
                      {
                        step: "১",
                        title: `ন্যূনতম উত্তোলন ৫০ টাকা`,
                        desc: "৫০ টাকার কম উত্তোলন করা যাবে না",
                      },
                      {
                        step: "২",
                        title: `সার্ভিস চার্জ ${feePercentage}%`,
                        desc: `${feePercentage}% সার্ভিস চার্জ প্রযোজ্য`,
                      },
                      {
                        step: "৩",
                        title: "প্রক্রিয়াকরণ সময়",
                        desc: "২৪-৪৮ ঘন্টার মধ্যে প্রক্রিয়াকরণ করা হবে",
                      },
                      {
                        step: "৪",
                        title: "সঠিক bKash নম্বর দিন",
                        desc: "আপনার সঠিক bKash নম্বর প্রদান করুন",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex gap-4 bg-slate-700/50 backdrop-blur-sm p-4 rounded-xl border border-slate-600/50 hover:border-green-500/30 transition duration-300 group"
                      >
                        <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 shadow-lg group-hover:scale-110 transition duration-300">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-sm">
                            {item.title}
                          </p>
                          <p className="text-slate-300 text-xs mt-1">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Enhanced Calculation Section */}
                {currentAmount > 0 && (
                  <div className="relative group/calc">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600/30 to-emerald-600/30 rounded-2xl blur-md group-hover/calc:blur-lg transition duration-500"></div>
                    <div className="relative bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/50 rounded-2xl p-5 backdrop-blur-sm">
                      <h4 className="text-white font-bold mb-3 text-center">
                        উত্তোলন সারাংশ
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-300">
                          <span>উত্তোলন পরিমাণ:</span>
                          <span>৳ {currentAmount.toLocaleString("bn-BD")}</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>সার্ভিস চার্জ ({feePercentage}%):</span>
                          <span>৳ {fee.toLocaleString("bn-BD")}</span>
                        </div>
                        <div className="border-t border-green-500/30 pt-2">
                          <div className="flex justify-between text-white font-bold">
                            <span>Total:</span>
                            <span>৳ {netAmount.toLocaleString("bn-BD")}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Warnings */}
                {currentAmount > 0 && (
                  <div className="space-y-2">
                    {currentAmount < 50 && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>ন্যূনতম উত্তোলন পরিমাণ ৫০ টাকা</span>
                      </div>
                    )}
                    {currentAmount > reseller.balance && (
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>আপনার ব্যালেন্স পর্যাপ্ত নয়</span>
                      </div>
                    )}
                    {currentAmount >= 50 && currentAmount <= reseller.balance && (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>উত্তোলন করার জন্য প্রস্তুত</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Enhanced Form */}
                <div className="space-y-5">
                  {[
                    {
                      label: "উত্তোলন পরিমাণ (টাকা) *",
                      name: "amount",
                      type: "number",
                      placeholder: "ন্যূনতম ৫০ টাকা",
                    },
                    {
                      label: "আপনার bKash নম্বর *",
                      name: "number",
                      type: "tel",
                      placeholder: "01XXXXXXXXX",
                    },
                  ].map((field, index) => (
                    <div key={field.name} className="group">
                      <label className="block text-slate-300 text-sm font-semibold mb-2">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={formData[field.name as keyof FormData]}
                        onChange={handleInputChange}
                        placeholder={field.placeholder}
                        className="w-full bg-slate-700/80 backdrop-blur-sm text-white px-4 py-4 rounded-xl border border-slate-600 focus:border-green-500 outline-none transition duration-300 focus:bg-slate-700 focus:shadow-lg focus:shadow-green-500/10 group-hover:border-slate-500"
                      />
                    </div>
                  ))}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSubmit}
                      disabled={
                        currentAmount < 50 ||
                        currentAmount > reseller.balance ||
                        !formData.number ||
                        !phoneRegex.test(formData.number)
                      }
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition duration-300 transform hover:scale-105 disabled:hover:scale-100 shadow-lg relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 transform translate-x-[-100%] group-hover:translate-x-[100%] transition duration-1000"></div>
                      <span className="relative z-10">উত্তোলন করুন</span>
                    </button>
                    <button
                      onClick={() => setShowWithdrawModal(false)}
                      className="flex-1 bg-slate-700/80 backdrop-blur-sm hover:bg-slate-600/80 text-white font-bold py-4 rounded-xl transition duration-300 border border-slate-600 hover:border-slate-500"
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

      {/* Enhanced Withdrawals Section */}
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 rounded-full blur opacity-50"></div>
            <History className="w-6 h-6 text-purple-300 relative" />
          </div>
          <h2 className="text-2xl font-bold text-white drop-shadow-lg">
            উত্তোলনের ইতিহাস
          </h2>
        </div>

        {withdrawals.length > 0 ? (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal._id} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-500"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 group-hover:border-green-500/30 rounded-2xl p-5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-green-500/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full blur-md group-hover:blur-lg transition duration-500"></div>
                        <div className="relative bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-3 shadow-lg">
                          <Send className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div>
                        <p className="text-white font-semibold capitalize">
                          {withdrawal.method}
                        </p>
                        <p className="text-slate-400 text-xs font-medium">
                          {withdrawal.number} • {new Date(withdrawal.createdAt).toLocaleDateString('bn-BD')}
                        </p>
                        {withdrawal.note && (
                          <p className="text-slate-500 text-xs mt-1">
                            {withdrawal.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">
                        ৳ {withdrawal.amount.toLocaleString("bn-BD")}
                      </p>
                      <p className="text-slate-400 text-sm">
                        চার্জ: ৳ {withdrawal.fee.toLocaleString("bn-BD")}
                      </p>
                      <p
                        className={`text-xs font-semibold px-3 py-1 rounded-full inline-block mt-1 ${
                          withdrawal.status === "completed"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : withdrawal.status === "rejected"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                        }`}
                      >
                        {withdrawal.status === "completed" && "সফল"}
                        {withdrawal.status === "pending" && "মুলতুবি"}
                        {withdrawal.status === "rejected" && "বাতিল"}
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
          <div className="text-white text-center mt-10">
            উত্তোলনের ইতিহাস পাওয়া যায়নি
          </div>
        )}
      </div>
    </div>
  );
}

// Phone regex for validation
const phoneRegex = /^(01[3-9]\d{8})$/;