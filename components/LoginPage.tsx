"use client";
import axios, { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  Activity,
  Zap,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { userLogin } from "@/lib/userSlice";

function LoginPage() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useAppDispatch();
  const { user, isLoggedIn } = useAppSelector((state) => state.userAuth);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("সব ফিল্ড পূরণ করুন");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("সঠিক ইমেইল ঠিকানা দিন");
      return;
    }

    setIsLoading(true);

    try {
      const res = await axios.post("/api/login", { email, password });
      dispatch(userLogin(res.data));
      router.push("/");
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("লগইন ব্যর্থ হয়েছে, পরে আবার চেষ্টা করুন");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/");
      toast.success(`Welcome back, ${user?.name}!`);
    }
  }, [isLoggedIn]);

  return (
    <div className="bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 min-h-screen flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-md">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Sign in to your account
            </p>
          </div>

          {/* Trust Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center mb-6">
            <div className="flex flex-col items-center space-y-1">
              <ShieldCheck className="h-5 w-5 text-pink-600" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                100% Secure
              </span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <Activity className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                99.99% Uptime
              </span>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <Zap className="h-5 w-5 text-pink-600" />
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Real-time Update
              </span>
            </div>
          </div>

          {/* Bengali Assurance Text */}
          <p className="text-center text-sm text-gray-700 dark:text-gray-300 mb-8 leading-relaxed">
            সার্ভারে নতুন কোনো আপডেট থাকলে দ্রুত সময়ে সমাধানের নিশ্চয়তা প্রদান করা হয়।
          </p>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleLogin}>
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border rounded-lg bg-white dark:bg-gray-800 dark:text-white"
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
