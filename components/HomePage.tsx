"use client";
import React, { useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Wallet,
  PieChart,
  Activity,
} from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";

// Type definitions
interface SpentItem {
  _id: string;
  user: string;
  service: string;
  data: string;
  amount: number;
  dataSchema: string;
  createdAt: string;
  updatedAt: string;
}

interface RechargeItem {
  _id: string;
  trxId: string;
  amount: number;
  method: string;
  status: "SUCCESS" | "PENDING" | "FAILED";
  number?: string;
  user: string;
  createdAt: string;
}

interface DashboardData {
  spentList: SpentItem[];
  recharges: RechargeItem[];
}

interface Calculations {
  totalSpent: number;
  totalRecharged: number;
  spentCount: number;
  rechargeCount: number;
  usageRate: number;
}

const Dashboard = () => {
  const [data, setData] = React.useState<DashboardData>({
    spentList: [],
    recharges: [],
  });

  const { user } = useAppSelector((state) => state.userAuth);
  const fetchData = async () => {
    try {
      const res = await axios.get(`/api/home`, { withCredentials: true });
      setData(res.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculations: Calculations = useMemo(() => {
    const totalSpent = data.spentList.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    console.log(data.recharges)
    const totalRecharged = data.recharges.reduce(
      (sum, item) => sum + item.amount,
      0
    );
    const balance = totalRecharged - totalSpent;
    const usageRate =
      totalRecharged > 0 ? (totalSpent / totalRecharged) * 100 : 0;

    return {
      totalSpent,
      totalRecharged,
      balance,
      spentCount: data.spentList.length,
      rechargeCount: data.recharges.length,
      usageRate,
    };
  }, [data]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number): string => {
    return `৳${amount.toLocaleString()}`;
  };

  const getStatusColor = (status: string): string => {
    const baseClasses = "inline-block text-xs px-2 py-1 rounded-full border";
    switch (status) {
      case "SUCCESS":
        return `${baseClasses} bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30`;
      case "PENDING":
        return `${baseClasses} bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30`;
      case "FAILED":
        return `${baseClasses} bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
            Financial Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track your spending and recharges in real-time
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Recharged */}
          <div className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {formatCurrency(calculations.totalRecharged)}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Total Recharged
            </p>
            <div className="mt-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              {calculations.rechargeCount} transactions
            </div>
          </div>

          {/* Total Spent */}
          <div className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/10 dark:hover:shadow-rose-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-rose-100 dark:bg-rose-500/10 rounded-xl">
                <CreditCard className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <ArrowDownLeft className="w-5 h-5 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {formatCurrency(calculations.totalSpent)}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Total Spent
            </p>
            <div className="mt-2 text-rose-600 dark:text-rose-400 text-sm font-medium">
              {calculations.spentCount} transactions
            </div>
          </div>

          {/* Balance */}
          <div
            className={`group bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg ${
              user.balance >= 0
                ? "border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-blue-500/10 dark:hover:shadow-blue-500/10"
                : "border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-amber-500/10 dark:hover:shadow-amber-500/10"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-2 rounded-xl ${
                  user.balance >= 0
                    ? "bg-blue-100 dark:bg-blue-500/10"
                    : "bg-amber-100 dark:bg-amber-500/10"
                }`}
              >
                <DollarSign
                  className={`w-6 h-6 ${
                    user.balance >= 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-amber-600 dark:text-amber-400"
                  }`}
                />
              </div>
              <Activity
                className={`w-5 h-5 ${
                  user.balance >= 0
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-amber-600 dark:text-amber-400"
                } group-hover:scale-110 transition-transform`}
              />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {formatCurrency(user.balance)}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Current Balance
            </p>
            <div
              className={`mt-2 text-sm font-medium ${
                user.balance >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {user.balance >= 0 ? "💰 Available" : "⚠️ Overdue"}
            </div>
          </div>

          {/* Usage Rate */}
          <div className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-xl">
                <PieChart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {calculations.usageRate.toFixed(1)}%
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Usage Rate
            </p>
            <div className="mt-2 text-purple-600 dark:text-purple-400 text-sm font-medium">
              of recharged amount
            </div>
          </div>
        </div>

        {/* Lists Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Recharges */}
          <div className="bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/10 dark:to-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Recharge History
                <span className="ml-auto bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm px-3 py-1 rounded-full">
                  {calculations.rechargeCount}
                </span>
              </h2>
            </div>
            <div className="overflow-y-auto max-h-96">
              {data.recharges.map((recharge) => (
                <div
                  key={recharge._id}
                  className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors last:border-b-0 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg group-hover:scale-110 transition-transform">
                        <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-medium">
                          {recharge.method}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          ID: {recharge.trxId}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                        +{formatCurrency(recharge.amount)}
                      </p>
                      <span className={getStatusColor(recharge.status)}>
                        {recharge.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs ml-11">
                    {formatDate(recharge.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Spending */}
          <div className="bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-rose-50 to-white dark:from-rose-500/10 dark:to-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-1.5 bg-rose-100 dark:bg-rose-500/20 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                Spending History
                <span className="ml-auto bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm px-3 py-1 rounded-full">
                  {calculations.spentCount}
                </span>
              </h2>
            </div>
            <div className="overflow-y-auto max-h-96">
              {data.spentList.map((spent) => (
                <div
                  key={spent._id}
                  className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors last:border-b-0 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-100 dark:bg-rose-500/10 rounded-lg group-hover:scale-110 transition-transform">
                        <CreditCard className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-medium">
                          {spent.dataSchema}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Service: {spent.service.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-rose-600 dark:text-rose-400 font-semibold text-lg">
                        -{formatCurrency(spent.amount)}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs ml-11">
                    {formatDate(spent.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Combined Transactions */}
        <div className="bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-500/10 dark:to-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              All Transactions
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ...data.recharges.map((r) => ({
                    ...r,
                    type: "recharge" as const,
                    amount: r.amount,
                  })),
                  ...data.spentList.map((s) => ({
                    ...s,
                    type: "spent" as const,
                    amount: -s.amount,
                  })),
                ]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .map((txn, idx) => (
                    <tr
                      key={`${txn.type}-${idx}`}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors last:border-b-0 group"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-all group-hover:scale-105 ${
                            txn.type === "recharge"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                              : "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20"
                          }`}
                        >
                          {txn.type === "recharge" ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownLeft className="w-3 h-3" />
                          )}
                          {txn.type === "recharge" ? "Recharge" : "Spent"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-medium">
                        {txn.type === "recharge" ? txn.method : txn.dataSchema}
                        {txn.type === "recharge" && txn.number && (
                          <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {txn.number}
                          </p>
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 font-semibold text-lg ${
                          txn.type === "recharge"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {txn.type === "recharge" ? "+" : ""}
                        {formatCurrency(Math.abs(txn.amount))}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                        {formatDate(txn.createdAt)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
