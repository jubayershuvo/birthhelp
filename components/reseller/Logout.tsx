"use client";

import { useAppDispatch } from "@/lib/hooks";
import { resellerLogout } from "@/lib/resellerSlice";
import { userLogout } from "@/lib/userSlice";
import axios from "axios";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LogoutButton() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    async function fetchData() {
      try {
        await axios.get(`/api/reseller/logout`, { withCredentials: true });
        dispatch(resellerLogout());
        router.push("/login");
      } catch (error) {
        toast.error("Error logging out. Please try again.");
      }
    }
    fetchData();
  };

  return (
    <button
      onClick={handleLogout}
      className="p-2 rounded-md hover:bg-red-950/50 transition-colors duration-300"
      title="Logout"
    >
      <LogOut size={24} className="text-red-600 dark:text-red-400" />
    </button>
  );
}
