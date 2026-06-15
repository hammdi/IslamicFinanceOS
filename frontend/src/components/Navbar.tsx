import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";

const languages = [
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
  { code: "fr", label: "FR" },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (user) {
      api.getWallet().then((w) => setBalance(w.balance)).catch(() => {});
      api.unreadCount().then((r) => setUnread(r.count)).catch(() => {});
      const interval = setInterval(() => {
        api.unreadCount().then((r) => setUnread(r.count)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, location.pathname]);

  const isActive = (path: string) =>
    location.pathname === path ? "bg-primary-700 text-white" : "text-primary-100 hover:bg-primary-600";

  const navLinks = user
    ? [
        { to: "/", label: t("nav.dashboard") },
        { to: "/wallet", label: t("nav.wallet") },
        { to: "/qard", label: t("nav.qard") },
        { to: "/musharaka", label: t("nav.musharaka") },
        { to: "/tontine", label: t("nav.tontine") },
        { to: "/murabaha", label: t("nav.murabaha") },
        { to: "/ijara", label: t("nav.ijara") },
        { to: "/zakat", label: t("nav.zakat") },
        { to: "/waqf", label: t("nav.waqf") },
        { to: "/sadaqa", label: t("nav.sadaqa") },
        { to: "/takaful", label: t("nav.takaful") },
        { to: "/hawala", label: t("nav.hawala") },
        { to: "/sukuk", label: t("nav.sukuk") },
        { to: "/screener", label: t("nav.screener") },
        { to: "/faraid", label: t("nav.faraid") },
        { to: "/marketplace", label: t("nav.marketplace") },
        { to: "/timebank", label: t("nav.timebank") },
        { to: "/family", label: t("nav.family") },
        { to: "/credit-score", label: t("nav.creditscore") },
      ]
    : [{ to: "/", label: t("nav.dashboard") }];

  const secondaryLinks = user
    ? [
        { to: "/community", label: t("nav.community") },
        { to: "/sulh", label: t("nav.sulh") },
        { to: "/transactions", label: t("nav.transactions") },
        { to: "/audit", label: t("nav.audit") },
      ]
    : [];

  return (
    <nav className="bg-primary-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-white font-bold text-lg flex-shrink-0">
            {t("app.title")}
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`px-2 py-1.5 rounded-md text-xs font-medium ${isActive(link.to)}`}>
                {link.label}
              </Link>
            ))}
            {secondaryLinks.map((link) => (
              <Link key={link.to} to={link.to}
                className={`px-2 py-1.5 rounded-md text-xs font-medium ${isActive(link.to)}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {/* Wallet balance */}
            {user && balance !== null && (
              <Link to="/wallet" className="hidden md:flex items-center bg-primary-700 text-white text-xs px-2 py-1 rounded">
                {balance.toFixed(2)} USD
              </Link>
            )}

            {/* Notification bell */}
            {user && (
              <Link to="/notifications" className="relative text-primary-100 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            )}

            {/* Language */}
            <select value={i18n.language}
              onChange={(e) => {
                i18n.changeLanguage(e.target.value);
                document.documentElement.dir = e.target.value === "ar" ? "rtl" : "ltr";
                document.documentElement.lang = e.target.value;
              }}
              className="bg-primary-700 text-white text-xs rounded px-1.5 py-1 border border-primary-600">
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>

            {/* User actions */}
            {user ? (
              <div className="hidden md:flex items-center space-x-2">
                <span className="text-primary-100 text-xs">{user.name}</span>
                {user.is_admin && (
                  <Link to="/admin" className="text-gold-400 text-xs hover:text-gold-300">Admin</Link>
                )}
                <button onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 rounded">
                  {t("nav.logout")}
                </button>
              </div>
            ) : (
              <div className="hidden md:flex space-x-2">
                <Link to="/login" className="text-primary-100 hover:text-white text-xs px-2 py-1">{t("nav.login")}</Link>
                <Link to="/register" className="bg-gold-500 hover:bg-gold-600 text-gray-900 text-xs px-2 py-1 rounded font-medium">{t("nav.register")}</Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button className="lg:hidden text-white p-1" onClick={() => setMobileOpen(!mobileOpen)}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 space-y-1">
            {[...navLinks, ...secondaryLinks].map((link) => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${isActive(link.to)}`}>
                {link.label}
              </Link>
            ))}
            {user && (
              <div className="border-t border-primary-700 pt-2 mt-2">
                {balance !== null && (
                  <Link to="/wallet" onClick={() => setMobileOpen(false)}
                    className="block px-3 py-1 text-primary-200 text-sm">{t("nav.wallet")}: {balance.toFixed(2)} USD</Link>
                )}
                <span className="block px-3 py-1 text-primary-200 text-sm">{user.name}</span>
                {user.is_admin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2 text-gold-400 text-sm">Admin</Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-red-300 hover:bg-primary-700 rounded-md text-sm">
                  {t("nav.logout")}
                </button>
              </div>
            )}
            {!user && (
              <div className="border-t border-primary-700 pt-2 mt-2 space-y-1">
                <Link to="/login" onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-primary-100 text-sm">{t("nav.login")}</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 text-gold-400 text-sm font-medium">{t("nav.register")}</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
