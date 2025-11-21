"use client";
import React, { useState, useEffect } from "react";
import { Mail, Phone, MessageCircle, Globe, Shield, Send, Loader2 } from "lucide-react";

interface SupportData {
  name: string;
  avatar: string;
  phone: string;
  email: string;
  lastLoginIp: string;
  telegramId: string;
  whatsapp: string;
}

export default function Supporter() {
  const [supportData, setSupportData] = useState<SupportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSupportData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch("/api/support");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch support data: ${response.status}`);
        }
        
        const data: SupportData = await response.json();
        setSupportData(data);
      } catch (err) {
        console.error("Error fetching support data:", err);
        setError(err instanceof Error ? err.message : "Failed to load support information");
      } finally {
        setLoading(false);
      }
    }

    fetchSupportData();
  }, []);

  // Function to truncate long text with ellipsis
  const truncateText = (text: string, maxLength: number = 20) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading support information...</p>
        </div>
      </div>
    );
  }

  if (error || !supportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Support Unavailable
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error || "Unable to load support information."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 
                     text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { name, avatar, phone, email, lastLoginIp, telegramId, whatsapp } = supportData;

  const contactMethods = [
    {
      icon: <Phone size={20} />,
      label: "Call",
      value: phone,
      displayValue: phone,
      href: `tel:${phone}`,
      color:
        "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700",
    },
    {
      icon: <Mail size={20} />,
      label: "Email",
      value: email,
      displayValue: truncateText(email, 24),
      href: `mailto:${email}`,
      color:
        "bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700",
      title: email, // Show full email on hover
    },
    {
      icon: <MessageCircle size={20} />,
      label: "WhatsApp",
      value: whatsapp,
      displayValue: whatsapp,
      href: `https://wa.me/${whatsapp.replace(/\D/g, "")}`,
      color:
        "bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700",
    },
    {
      icon: <Send size={20} />,
      label: "Telegram",
      value: telegramId || "Not available",
      displayValue: telegramId ? truncateText(telegramId, 20) : "Not available",
      href: telegramId ? `https://t.me/${telegramId}` : "#",
      color: telegramId 
        ? "bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700"
        : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed",
      disabled: !telegramId,
      title: telegramId || undefined,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto"> {/* Increased max-width */}
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Customer Support
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            We&apos;re here to help you! Get in touch with our support team
            through any of the following methods.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6"> {/* Changed to xl for better responsiveness */}
          {/* Support Agent Card */}
          <div className="xl:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 sticky top-6">
              {/* Agent Profile */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <img
                    src={
                      avatar ||
                      `https://api.dicebear.com/7.x/initials/svg?seed=${name}`
                    }
                    alt={name}
                    className="w-24 h-24 rounded-full mx-auto border-4 border-indigo-200 dark:border-indigo-600 shadow-md"
                  />
                  <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-800"></div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-4 break-words">
                  {name}
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Support Specialist
                </p>
              </div>

              {/* Availability Status */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-green-800 dark:text-green-400 font-medium">
                    Online Now
                  </span>
                </div>
                <p className="text-green-700 dark:text-green-300 text-sm text-center mt-1">
                  Ready to help you
                </p>
              </div>

              {/* Security Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Shield
                    size={16}
                    className="text-blue-600 dark:text-blue-400 mr-2"
                  />
                  <span className="text-blue-800 dark:text-blue-300 text-sm font-medium">
                    Secure Connection
                  </span>
                </div>
                <div className="flex items-center">
                  <Globe
                    size={16}
                    className="text-blue-600 dark:text-blue-400 mr-2"
                  />
                  <span className="text-blue-700 dark:text-blue-300 text-xs break-all">
                    Last active: {lastLoginIp}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Methods */}
          <div className="xl:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Contact Methods
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8"> {/* Changed to lg for better responsiveness */}
                {contactMethods.map((method, index) => (
                  <a
                    key={index}
                    href={method.href}
                    target={method.disabled ? "_self" : "_blank"}
                    rel={method.disabled ? "" : "noopener noreferrer"}
                    className={`
                      ${method.color}
                      text-white rounded-xl p-4 transition-all duration-300 
                      transform hover:scale-105 hover:shadow-lg
                      flex items-center justify-between
                      ${method.disabled ? 'cursor-not-allowed opacity-70 hover:scale-100' : ''}
                      min-h-[80px] /* Fixed height for consistency */
                    `}
                    onClick={method.disabled ? (e) => e.preventDefault() : undefined}
                    title={method.title} /* Tooltip for full text */
                  >
                    <div className="flex items-center flex-1 min-w-0"> {/* Added flex-1 and min-w-0 for text truncation */}
                      <div className="bg-white/20 p-2 rounded-lg mr-3 flex-shrink-0">
                        {method.icon}
                      </div>
                      <div className="min-w-0 flex-1"> {/* Added for text truncation */}
                        <div className="font-semibold truncate">{method.label}</div>
                        <div className="text-white/90 text-sm truncate" title={method.value}>
                          {method.displayValue}
                        </div>
                      </div>
                    </div>
                    <div className="text-white/80 flex-shrink-0 ml-2">
                      <MessageCircle size={20} />
                    </div>
                  </a>
                ))}
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Support Hours
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium">
                      Availability
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      24/7 Support
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 dark:text-gray-300 font-medium">
                      Response Time
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Within 5 minutes
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 mb-3">
                  Quick Tips
                </h4>
                <ul className="text-sm text-indigo-800 dark:text-indigo-300 space-y-2">
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span>Have your account details ready for faster service</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span>Describe your issue clearly for quick resolution</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span>Screenshots help us understand the problem better</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl shadow-lg p-6 mt-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                <h3 className="text-xl font-bold text-red-900 dark:text-red-200">
                  Emergency Support
                </h3>
              </div>
              <p className="text-red-800 dark:text-red-300 mb-4">
                For urgent issues requiring immediate attention, please call directly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <a
                  href={`tel:${phone}`}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 
                           text-white font-semibold py-3 px-6 rounded-lg 
                           transition-all duration-300 transform hover:scale-105 
                           flex items-center justify-center flex-1 min-w-0 w-full sm:w-auto"
                >
                  <Phone size={20} className="mr-2 flex-shrink-0" />
                  <span className="truncate">Emergency Call: {phone}</span>
                </a>
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800 
                           text-white font-semibold py-3 px-6 rounded-lg 
                           transition-all duration-300 transform hover:scale-105 
                           flex items-center justify-center flex-1 min-w-0 w-full sm:w-auto"
                >
                  <MessageCircle size={20} className="mr-2 flex-shrink-0" />
                  <span className="truncate">WhatsApp Emergency</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            We value your privacy and ensure all conversations are secure and confidential.
          </p>
        </div>
      </div>
    </div>
  );
}