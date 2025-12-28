"use client";
import React, { useState, useEffect } from "react";
import {
  Menu,
  X,
  Home,
  ArrowLeftToLine,
  ArrowRightToLine,
  Wallet,
  ShoppingBag,
  MessageCircle,
  ArrowBigRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "../ThemeMod";
import LogoutButton from "../Logout";
import toast, { Toaster } from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { updateUser, userLogout } from "@/lib/userSlice";
import axios from "axios";
import TelegramPopup from "../TelegramPopup";

const menuItemsd = [
  { label: "Home", icon: <Home size={20} />, href: "/" },
  {
    label: "Services",
    icon: <ShoppingBag size={20} />,
    href: "/services",
  },
  {
    label: "Order Posts",
    icon: <MessageCircle size={20} />,
    href: "/my-posts",
  },
  {
    label: "Wallet",
    icon: <Wallet size={20} />,
    href: "/wallet",
  },
];

export default function Nav({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, isLoggedIn } = useAppSelector((state) => state.userAuth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState(menuItemsd);

  const handleLogout = () => {
    async function fetchData() {
      try {
        await axios.get(`/api/logout`, { withCredentials: true });
        dispatch(userLogout());
        router.push("/login");
      } catch (error) {
        toast.error("Error logging out. Please try again.");
      }
    }
    fetchData();
  };
  useEffect(() => {
    let prevWidth = window.innerWidth;

    const handleResize = () => {
      const currentWidth = window.innerWidth;

      if (currentWidth > prevWidth) {
        setCollapsed(false);
      } else if (currentWidth < prevWidth) {
        setCollapsed(true);
      }

      prevWidth = currentWidth; // update previous width
    };

    window.addEventListener("resize", handleResize);

    // run once to initialize
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user profile and counts
  useEffect(() => {

    if (pathname.startsWith("/reseller") || pathname === "/login") return;

    // if (!mounted) return;
    // if (!isLoggedIn) return handleLogout();

    async function fetchData() {
      try {
        const response = await axios.get(`/api/profile`, {
          withCredentials: true,
        });
        dispatch(updateUser(response.data));
        try {
          const response = await axios.get(`/api/services`, {
            withCredentials: true,
          });
          const data = response.data;
          const newNavItems = data.map(
            ({
              service: { name, href },
            }: {
              service: { name: string; href: string };
            }) => ({
              label: name,
              icon: <ArrowBigRight size={20} />,
              href,
            })
          );

          setMenuItems([...menuItemsd, ...newNavItems]);
        } catch (error) {
          console.log(error);
        }
      } catch (error: unknown) {
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error
        ) {
          const err = error as { response?: { status?: number } };
          if (err.response?.status === 401) {
            handleLogout();
          }
        } else if (error instanceof Error) {
          console.error("Error fetching profile:", error.message);
        } else if (typeof error === "object" && error !== null) {
          console.error("Error fetching profile:", JSON.stringify(error));
        } else {
          console.error("Error fetching profile:", String(error));
        }
      }
    }

    fetchData();
  }, [pathname]); // Add dependencies

  if (!mounted) {
    return null;
  }

  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reseller")
  ) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* HEADER */}
      <Toaster position="top-center" reverseOrder={false} />
      <TelegramPopup />
      <header
        className="w-full h-16 bg-gradient-to-r from-indigo-600 via-indigo-500 to-teal-500 
        flex items-center justify-between px-4 shadow-md"
      >
        <div className="flex items-center">
          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white md:hidden mr-3"
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-2 rounded-md hover:bg-indigo-400/30 
              dark:hover:bg-teal-700/40 transition-colors duration-300 mr-3 text-white"
          >
            {collapsed ? (
              <ArrowRightToLine size={20} />
            ) : (
              <ArrowLeftToLine size={20} />
            )}
          </button>

          <h1 className="text-lg font-semibold text-white">BDRIS</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Balance Display */}
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Wallet size={16} className="text-white" />
            <span className="text-white font-medium text-sm">
              BDT {user?.balance || "0.00"}
            </span>
          </div>

          <LogoutButton />
          <ThemeToggle />
        </div>
      </header>

      {/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR (desktop) */}
        <aside
          className={`hidden overflow-y-auto pt-1 md:flex flex-col transition-all duration-300 ease-in-out 
            bg-gradient-to-b from-slate-100 to-slate-50 
            dark:from-slate-900 dark:to-slate-800
            text-gray-900 dark:text-gray-100 shadow-lg
            ${collapsed ? "w-20" : "w-64"}`}
        >
          {menuItems.map((item) => (
            <Link
              key={item?.href}
              href={item?.href}
              className={`flex  ${
                collapsed ? "justify-center" : "justify-start"
              } ${
                pathname === item?.href
                  ? "bg-blue-200/70 dark:bg-blue-700/50"
                  : ""
              } p-4 mx-2 my-1 rounded-lg 
                hover:bg-indigo-200/70 dark:hover:bg-teal-700/50 group relative transition-all duration-300 ease-in-out`}
            >
              <span className="group-hover:block">{item?.icon}</span>
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  collapsed ? "opacity-0 absolute left-14" : "opacity-100"
                }`}
              >
                {item?.label}
              </span>
            </Link>
          ))}
          <div className="mt-auto mb-4">
            <Link
              href="/profile"
              className={`flex  ${
                collapsed ? "justify-center" : "justify-start"
              }  p-4 mx-2 my-1 rounded-lg group relative transition-all duration-300 ease-in-out`}
            >
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`
                }
                alt=""
                className="w-8 h-8 rounded-full mr-2"
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  collapsed ? "opacity-0 absolute left-14" : "opacity-100"
                }`}
              >
                {user?.name}
              </span>
            </Link>
          </div>
        </aside>

        {/* SIDEBAR (mobile) */}
        <div
          className={`md:hidden overflow-y-auto fixed top-16 left-0 h-[calc(100%-4rem)] w-64 
              bg-gradient-to-b from-slate-100 to-slate-50 
              dark:from-slate-900 dark:to-slate-800
              text-gray-900 dark:text-gray-100 shadow-lg z-40 transform transition-transform duration-300 
              ${
                mobileOpen ? "translate-x-0" : "-translate-x-64"
              } flex flex-col`}
        >
          <div className="flex-1 m-2">
            {menuItems.map((item) => (
              <Link
                key={item?.href}
                href={item?.href}
                onClick={() => setMobileOpen(false)}
                className={`
                flex items-center p-4 mb-2 rounded-lg transition-all
                ${
                  pathname === item?.href
                    ? "bg-indigo-300/80 dark:bg-blue-700/60 font-semibold"
                    : "hover:bg-indigo-200/70 dark:hover:bg-teal-700/50"
                }
      `}
              >
                {item?.icon}
                <span className="ml-3 font-medium">{item?.label}</span>
              </Link>
            ))}
          </div>

          <div className="mb-4">
            <Link
              href="/profile"
              className="flex items-center p-4 rounded-lg 
               hover:bg-indigo-200/70 dark:hover:bg-teal-700/50 transition-all"
              onClick={() => setMobileOpen(false)}
            >
              <img
                src={
                  user?.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${user?.username}`
                }
                alt=""
                className="w-8 h-8 rounded-full mr-2"
              />
              <span className="ml-3 font-medium">{user?.name}</span>
            </Link>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main
          className="flex-1 overflow-auto 
            text-gray-900 dark:text-gray-100 
            bg-gradient-to-b from-white to-slate-50 
            dark:from-slate-950 dark:to-slate-900 relative"
        >
          {children}

          {/* Fixed Support Button */}
          {pathname !== "/support" && (
            <Link
              href="/support"
              className="fixed bottom-6 right-6 z-50 flex items-center justify-center 
              w-14 h-14 rounded-full shadow-lg 
              bg-gradient-to-r from-indigo-500 to-teal-500 
              hover:from-indigo-600 hover:to-teal-600 
              dark:from-indigo-600 dark:to-teal-600 
              dark:hover:from-indigo-700 dark:hover:to-teal-700 
              text-white transition-all duration-300 ease-in-out 
              hover:scale-110 hover:shadow-xl 
              group"
            >
              <MessageCircle
                size={24}
                className="group-hover:scale-110 transition-transform"
              />
              <span className="sr-only">Support</span>
            </Link>
          )}
        </main>
      </div>
    </div>
  );
}
