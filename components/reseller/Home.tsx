"use client";
import React, { useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Wallet,
  User,
  Mail,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  Activity,
} from "lucide-react";
import { useAppSelector } from "@/lib/hooks";
import axios from "axios";
import Link from "next/link";

// Type definitions
interface User {
  _id: string;
  name: string;
  email: string;
}

interface EarningItem {
  _id: string;
  user: User;
  reseller: string;
  service: string;
  data: string;
  amount: number;
  dataSchema: string;
  createdAt: string;
  updatedAt: string;
}

interface WithdrawalItem {
  _id: string;
  user: string;
  amount: number;
  fee: number;
  accountType: string;
  method: string;
  number: string;
  status: "completed" | "rejected" | "pending";
  note: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  earnings: EarningItem[];
  withdrawals: WithdrawalItem[];
}

interface Calculations {
  totalEarnings: number;
  totalWithdrawn: number;
  totalFees: number;
  pendingWithdrawals: number;
  rejectedWithdrawals: number;
  completedCount: number;
  rejectedCount: number;
  pendingCount: number;
}

interface ResellerAuthState {
  reseller: {
    balance: number;
  };
}

const EarningsWithdrawalsDashboard = () => {
  const [data, setData] = React.useState<DashboardData>({
    earnings: [],
    withdrawals: [],
  });

  const { reseller } = useAppSelector((state: { resellerAuth: ResellerAuthState }) => state.resellerAuth);
  
  const fetchData = async () => {
    try {
      const res = await axios.get<DashboardData>(`/api/reseller/home`, {
        withCredentials: true,
      });
      setData(res.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculations: Calculations = useMemo(() => {
    const totalEarnings = data.earnings.reduce(
      (sum: number, item: EarningItem) => sum + item.amount,
      0
    );
    const totalWithdrawn = data.withdrawals
      .filter((w: WithdrawalItem) => w.status === "completed")
      .reduce((sum: number, item: WithdrawalItem) => sum + (item.amount - item.fee), 0);
    const totalFees = data.withdrawals.reduce((sum: number, item: WithdrawalItem) => sum + item.fee, 0);
    const pendingWithdrawals = data.withdrawals
      .filter((w: WithdrawalItem) => w.status === "pending")
      .reduce((sum: number, item: WithdrawalItem) => sum + item.amount, 0);
    const rejectedWithdrawals = data.withdrawals
      .filter((w: WithdrawalItem) => w.status === "rejected")
      .reduce((sum: number, item: WithdrawalItem) => sum + item.amount, 0);

    return {
      totalEarnings,
      totalWithdrawn,
      totalFees,
      pendingWithdrawals,
      rejectedWithdrawals,
      completedCount: data.withdrawals.filter((w: WithdrawalItem) => w.status === "completed").length,
      rejectedCount: data.withdrawals.filter((w: WithdrawalItem) => w.status === "rejected").length,
      pendingCount: data.withdrawals.filter((w: WithdrawalItem) => w.status === "pending").length,
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
      case "completed":
        return `${baseClasses} bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30`;
      case "pending":
        return `${baseClasses} bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30`;
    }
  };

  const getStatusIcon = (status: string): React.ReactNode => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-2">
            Earnings & Withdrawals
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage your earnings and track withdrawal requests
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Total Earnings */}
          <div className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <ArrowUpRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {formatCurrency(calculations.totalEarnings)}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Total Earnings
            </p>
            <div className="mt-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              {data.earnings.length} earnings
            </div>
          </div>

          {/* Available Balance */}
          <div className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-blue-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {formatCurrency(reseller.balance)}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Available Balance
            </p>
            <Link href="/reseller/wallet">
              <div className="mt-2 text-blue-600 dark:text-blue-400 text-sm font-medium cursor-pointer hover:underline">
                Ready to withdraw
              </div>
            </Link>
          </div>

          {/* Total Withdrawn */}
          <div className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 dark:hover:shadow-purple-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-500/10 rounded-xl">
                <TrendingDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <ArrowDownLeft className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {formatCurrency(calculations.totalWithdrawn)}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Total Withdrawn
            </p>
            <div className="mt-2 text-purple-600 dark:text-purple-400 text-sm font-medium">
              {calculations.completedCount} completed
            </div>
          </div>

          {/* Pending Withdrawals */}
          <div className="group bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 dark:hover:shadow-amber-500/10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {formatCurrency(calculations.pendingWithdrawals)}
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Pending Withdrawals
            </p>
            <div className="mt-2 text-amber-600 dark:text-amber-400 text-sm font-medium">
              {calculations.pendingCount} requests
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
          {/* Earnings Section */}
          <div className="bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="bg-gradient-to-r from-emerald-50 to-white dark:from-emerald-500/10 dark:to-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Recent Earnings
                <span className="ml-auto bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm px-3 py-1 rounded-full">
                  {data.earnings.length}
                </span>
              </h2>
            </div>
            <div className="overflow-y-auto max-h-96">
              {data.earnings.length > 0 ? (
                data.earnings.map((earning: EarningItem) => (
                  <div
                    key={earning._id}
                    className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors last:border-b-0 group"
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-semibold text-sm">
                          {earning.user.name}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {earning.user.email}
                        </p>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg">
                          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-white font-medium">
                            {earning.dataSchema}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Service: {earning.service.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-lg">
                          +{formatCurrency(earning.amount)}
                        </p>
                      </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs ml-11">
                      {formatDate(earning.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-slate-400">
                  <p>No earnings yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="space-y-6">
            {/* Completed Withdrawals */}
            <div className="bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      Completed Withdrawals
                    </p>
                    <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                      {formatCurrency(calculations.totalWithdrawn)} total
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {calculations.completedCount}
                </div>
              </div>
            </div>

            {/* Rejected Withdrawals */}
            <div className="bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-xl">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      Rejected Withdrawals
                    </p>
                    <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                      {formatCurrency(calculations.rejectedWithdrawals)} total
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {calculations.rejectedCount}
                </div>
              </div>
            </div>

            {/* Transaction Fees */}
            <div className="bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all duration-300 group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-500/10 rounded-xl">
                    <CreditCard className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-slate-900 dark:text-white font-semibold">
                      Transaction Fees
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Applied to withdrawals
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                  {formatCurrency(calculations.totalFees)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white dark:bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="bg-gradient-to-r from-orange-50 to-white dark:from-orange-500/10 dark:to-slate-800/50 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-3">
              <div className="p-1.5 bg-orange-100 dark:bg-orange-500/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              Withdrawal Requests
              <span className="ml-auto bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm px-3 py-1 rounded-full">
                {data.withdrawals.length}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Account
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Note
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.withdrawals.map((withdrawal: WithdrawalItem) => (
                  <tr
                    key={withdrawal._id}
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors last:border-b-0 group"
                  >
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          withdrawal.status
                        )} group-hover:scale-105 transition-transform`}
                      >
                        {getStatusIcon(withdrawal.status)}
                        <span className="capitalize">{withdrawal.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(withdrawal.amount)}
                      </span>
                      {withdrawal.fee > 0 && (
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                          Fee: {formatCurrency(withdrawal.fee)}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300 capitalize">
                      {withdrawal.method}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                      <div className="font-mono">{withdrawal.number}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 capitalize">
                        {withdrawal.accountType}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm max-w-xs">
                      {withdrawal.note}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">
                      {formatDate(withdrawal.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">
              Net Earnings
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(
                calculations.totalEarnings - calculations.totalFees
              )}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">
              Total Requests
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.withdrawals.length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">
              Success Rate
            </p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.withdrawals.length > 0
                ? (
                    (calculations.completedCount / data.withdrawals.length) *
                    100
                  ).toFixed(0)
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsWithdrawalsDashboard;