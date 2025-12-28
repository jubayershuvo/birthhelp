import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function TelegramPopup() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if popup should be shown
    const popupData = localStorage.getItem('telegramPopupData');
    
    if (!popupData) {
      // First time user
      setShowPopup(true);
    } else {
      const data = JSON.parse(popupData);
      const now = Date.now();
      
      // Check if 7 days have passed since last pause
      if (data.pausedUntil && now < data.pausedUntil) {
        setShowPopup(false);
      } else if (data.joined) {
        setShowPopup(false);
      } else {
        setShowPopup(true);
      }
    }
  }, []);

  const handleJoined = () => {
    localStorage.setItem('telegramPopupData', JSON.stringify({
      joined: true,
      timestamp: Date.now()
    }));
    setShowPopup(false);
  };

  const handleJoin = () => {
    window.open('https://t.me/mybirthhelp', '_blank');
  };

  const handlePause = () => {
    const sevenDays = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    localStorage.setItem('telegramPopupData', JSON.stringify({
      pausedUntil: Date.now() + sevenDays,
      timestamp: Date.now()
    }));
    setShowPopup(false);
  };

  const handleClose = () => {
    // Just close for this session, will show again on next visit
    setShowPopup(false);
  };

  if (!showPopup) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      ></div>
      
      {/* Popup */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full z-10 border border-gray-200 dark:border-gray-700">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        {/* Telegram Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full p-4 shadow-lg">
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
            </svg>
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-4">
          সাহায্য প্রয়োজন?
        </h2>
        
        <p className="text-center text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          আমাদের টেলিগ্রাম গ্রুপে যোগ দিন এবং তাৎক্ষণিক সাহায্য পান। আমাদের কমিউনিটি সবসময় আপনাকে সাহায্য করতে প্রস্তুত!
        </p>

        {/* Buttons */}
        <div className="space-y-3">
          {/* Already Joined Button */}
          <button
            onClick={handleJoined}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            ✓ ইতিমধ্যে যোগ দিয়েছি
          </button>

          {/* Join Now Button */}
          <button
            onClick={handleJoin}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            এখনই যোগ দিন
          </button>

          {/* Pause for 7 Days Button */}
          <button
            onClick={handlePause}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-300 dark:border-gray-600"
          >
            ⏸ ৭ দিনের জন্য বিরতি
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          আপনার প্রশ্নের উত্তর পেতে আজই যোগ দিন!
        </p>
      </div>
    </div>
  );
}