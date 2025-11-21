"use client";

import { useEffect, useState, useRef } from "react";

interface DevToolsDetection {
  isBlocked: boolean;
  detectionMethod?: string;
}

interface WindowWithDevTools extends Window {
  devtools?: {
    isOpen: boolean;
  };
  opera?: unknown;
  webpackHotUpdate?: unknown;
}

export default function useDevToolsBlocker(): boolean {
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const detectionCount = useRef<number>(0);
  const blockedState = useRef<boolean>(false);

  useEffect(() => {
    let detectionInterval: NodeJS.Timeout;
    let resizeTimeout: NodeJS.Timeout;

    // Define preventShortcuts function at the top level
    const preventShortcuts = (e: KeyboardEvent): void => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.metaKey && e.altKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const preventContextMenu = (e: Event): void => {
      e.preventDefault();
    };

    const isDevToolsOpen = (): DevToolsDetection => {
      // 1. Window size difference detection (Most reliable)
      const widthDifference = Math.abs(window.outerWidth - window.innerWidth);
      const heightDifference = Math.abs(window.outerHeight - window.innerHeight);
      const sizeThreshold = 160;

      if (widthDifference > sizeThreshold || heightDifference > sizeThreshold) {
        return { isBlocked: true, detectionMethod: 'window_size' };
      }

      // 2. Firefox specific detection
      if (navigator.userAgent.includes('Firefox')) {
        try {
          // @ts-ignore
          if (window.outerWidth === 0 && window.outerHeight === 0) {
            return { isBlocked: true, detectionMethod: 'firefox_specific' };
          }
        } catch (e) {
          return { isBlocked: true, detectionMethod: 'firefox_exception' };
        }
      }

      // 3. Console log timing detection
      const startTime = performance.now();
      console.log('detection');
      const endTime = performance.now();
      
      if (endTime - startTime > 100) {
        return { isBlocked: true, detectionMethod: 'console_timing' };
      }

      // 4. Debugger execution timing (FIXED: using different variable name)
      const debuggerStart = performance.now();
      (() => {
        // Use a different variable name to avoid reserved keyword
        const debuggerFunction = new Function("debugger;");
        try {
          debuggerFunction();
        } catch (e) {
          // Expected behavior when devtools is closed
        }
      })();
      const debuggerEnd = performance.now();

      if (debuggerEnd - debuggerStart > 100) {
        return { isBlocked: true, detectionMethod: 'debugger_timing' };
      }

      // 5. Eval toString detection
      try {
        // Normal eval toString length is typically 33 or similar
        const evalString = eval.toString();
        if (evalString.length < 30 || evalString.length > 40) {
          return { isBlocked: true, detectionMethod: 'eval_toString' };
        }
      } catch (e) {
        return { isBlocked: true, detectionMethod: 'eval_exception' };
      }

      // 6. Function constructor detection
      try {
        const functionToString = Function.prototype.toString.toString();
        if (functionToString.length < 40 || functionToString.length > 50) {
          return { isBlocked: true, detectionMethod: 'function_constructor' };
        }
      } catch (e) {
        return { isBlocked: true, detectionMethod: 'function_exception' };
      }

      // 7. Date toString timing detection
      const dateStart = Date.now();
      console.log(Date.now());
      if (Date.now() - dateStart > 50) {
        return { isBlocked: true, detectionMethod: 'date_timing' };
      }

      // 8. Error stack detection
      try {
        const error = new Error();
        if (error.stack) {
          const stack = error.stack.toLowerCase();
          if (stack.includes('chrome-extension://') || 
              stack.includes('devtools://') ||
              stack.includes('debugger')) {
            return { isBlocked: true, detectionMethod: 'error_stack' };
          }
        }
      } catch (e) {
        // Ignore error
      }

      // 9. Window properties detection
      const win = window as WindowWithDevTools;
      if (win.devtools || win.webpackHotUpdate) {
        return { isBlocked: true, detectionMethod: 'window_properties' };
      }

      // 10. User agent console detection
      if (console && (console as any).firebug) {
        return { isBlocked: true, detectionMethod: 'firebug_detection' };
      }

      return { isBlocked: false };
    };

    const blockApplication = (): void => {
      if (blockedState.current) return;
      
      blockedState.current = true;
      setIsBlocked(true);
      
      // Save current scroll position
      const scrollY = window.scrollY;
      sessionStorage.setItem('devtools_blocker_scroll', scrollY.toString());
      
      // Create blocking overlay
      const overlay = document.createElement('div');
      overlay.id = 'devtools-blocker-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: white;
        z-index: 999999;
        display: flex;
        justify-content: center;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        color: #333;
        text-align: center;
        cursor: not-allowed;
      `;
      
      overlay.innerHTML = `
        <div style="padding: 2rem; max-width: 500px;">
          <h1 style="font-size: 1.5rem; margin-bottom: 1rem; color: #dc2626;">
            Developer Tools Detected
          </h1>
          <p style="margin-bottom: 1.5rem; line-height: 1.5;">
            For security reasons, Developer Tools cannot be open while using this application.
            Please close Developer Tools and refresh the page to continue.
          </p>
          <button 
            onclick="window.location.reload()" 
            style="
              padding: 0.75rem 1.5rem;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 0.375rem;
              cursor: pointer;
              font-size: 1rem;
            "
          >
            Reload Page
          </button>
        </div>
      `;

      // Disable all interactions
      document.body.style.pointerEvents = 'none';
      document.body.style.overflow = 'hidden';
      document.body.appendChild(overlay);

      // Prevent keyboard shortcuts
      document.addEventListener('keydown', preventShortcuts, true);
      window.addEventListener('contextmenu', preventContextMenu, true);
    };

    const unblockApplication = (): void => {
      if (!blockedState.current) return;
      
      blockedState.current = false;
      setIsBlocked(false);
      
      // Remove overlay
      const overlay = document.getElementById('devtools-blocker-overlay');
      if (overlay) {
        overlay.remove();
      }
      
      // Restore interactions
      document.body.style.pointerEvents = 'auto';
      document.body.style.overflow = 'auto';
      
      // Remove event listeners
      document.removeEventListener('keydown', preventShortcuts, true);
      window.removeEventListener('contextmenu', preventContextMenu, true);
      
      // Restore scroll position
      const savedScroll = sessionStorage.getItem('devtools_blocker_scroll');
      if (savedScroll) {
        window.scrollTo(0, parseInt(savedScroll));
        sessionStorage.removeItem('devtools_blocker_scroll');
      }
      
      console.info('✅ DevTools closed - application restored');
    };

    const checkDevTools = (): void => {
      const detection = isDevToolsOpen();
      
      if (detection.isBlocked && !blockedState.current) {
        detectionCount.current++;
        
        // Require multiple consecutive detections to prevent false positives
        if (detectionCount.current >= 2) {
          console.warn(`🚫 DevTools detected via: ${detection.detectionMethod}`);
          blockApplication();
        }
      } else if (!detection.isBlocked && blockedState.current) {
        detectionCount.current = 0;
        unblockApplication();
        
        // Reload page to ensure clean state
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else if (!detection.isBlocked) {
        detectionCount.current = 0;
      }
    };

    // Enhanced resize detection
    const handleResize = (): void => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        checkDevTools();
      }, 100);
    };

    // Initial check
    checkDevTools();

    // Set up monitoring
    detectionInterval = setInterval(checkDevTools, 1000);
    window.addEventListener('resize', handleResize);
    window.addEventListener('focus', checkDevTools);

    // Cleanup function
    return (): void => {
      clearInterval(detectionInterval);
      if (resizeTimeout) clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('focus', checkDevTools);
      
      // Clean up event listeners
      document.removeEventListener('keydown', preventShortcuts, true);
      window.removeEventListener('contextmenu', preventContextMenu, true);
      
      // Remove any existing overlay on unmount
      const overlay = document.getElementById('devtools-blocker-overlay');
      if (overlay) {
        overlay.remove();
      }
    };
  }, []);

  return isBlocked;
}