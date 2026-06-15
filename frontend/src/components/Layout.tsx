import { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function Layout() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [wallet, setWallet] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      fetch("http://localhost:8000/notifications/unread-count", { headers })
        .then(r => r.json()).then(d => setUnread(d.count)).catch(() => {});
      fetch("http://localhost:8000/wallet/", { headers })
        .then(r => r.json()).then(d => setWallet(d.balance)).catch(() => {});
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="lg:hidden w-8" /> {/* spacer for mobile hamburger */}
          <div className="flex-1" />

          {user && (
            <div className="flex items-center gap-4">
              {/* Wallet balance */}
              {wallet !== null && (
                <Link to="/wallet" className="flex items-center gap-1.5 bg-primary-50 text-primary-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  {wallet.toFixed(2)} USD
                </Link>
              )}

              {/* Notifications */}
              <Link to="/notifications" className="relative p-2 text-gray-500 hover:text-primary-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              {/* User */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm text-gray-700 hidden md:block">{user.name}</span>
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>

        <footer className="text-center py-3 text-xs text-gray-400 border-t border-gray-100">
          IslamicFinance OS — Open Source Ethical Finance
        </footer>
      </div>
    </div>
  );
}
