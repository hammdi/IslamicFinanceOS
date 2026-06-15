import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

/* ── SVG icon paths (Heroicons) ── */
const icons: Record<string, string> = {
  dashboard: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  wallet: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
  qard: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  musharaka: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  tontine: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  murabaha: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  ijara: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  takaful: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  sukuk: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
  zakat: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  waqf: "M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z",
  sadaqa: "M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7",
  hawala: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  screener: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  faraid: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  marketplace: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  timebank: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  family: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a2 2 0 01-2-2v-4a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2h-4z",
  creditscore: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  community: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  transactions: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  audit: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  sulh: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3",
  notifications: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  admin: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  help: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

const Icon = ({ name, className = "w-5 h-5" }: { name: string; className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={icons[name] || icons.dashboard} />
  </svg>
);

const menuGroups = [
  { label: "main", items: [
    { to: "/", icon: "dashboard", key: "dashboard" },
    { to: "/wallet", icon: "wallet", key: "wallet" },
  ]},
  { label: "products", items: [
    { to: "/qard", icon: "qard", key: "qard" },
    { to: "/musharaka", icon: "musharaka", key: "musharaka" },
    { to: "/tontine", icon: "tontine", key: "tontine" },
    { to: "/murabaha", icon: "murabaha", key: "murabaha" },
    { to: "/ijara", icon: "ijara", key: "ijara" },
    { to: "/takaful", icon: "takaful", key: "takaful" },
    { to: "/sukuk", icon: "sukuk", key: "sukuk" },
  ]},
  { label: "charity", items: [
    { to: "/zakat", icon: "zakat", key: "zakat" },
    { to: "/waqf", icon: "waqf", key: "waqf" },
    { to: "/sadaqa", icon: "sadaqa", key: "sadaqa" },
  ]},
  { label: "tools", items: [
    { to: "/hawala", icon: "hawala", key: "hawala" },
    { to: "/screener", icon: "screener", key: "screener" },
    { to: "/faraid", icon: "faraid", key: "faraid" },
    { to: "/marketplace", icon: "marketplace", key: "marketplace" },
    { to: "/timebank", icon: "timebank", key: "timebank" },
  ]},
  { label: "personal", items: [
    { to: "/family", icon: "family", key: "family" },
    { to: "/credit-score", icon: "creditscore", key: "creditscore" },
    { to: "/community", icon: "community", key: "community" },
  ]},
  { label: "system", items: [
    { to: "/transactions", icon: "transactions", key: "transactions" },
    { to: "/audit", icon: "audit", key: "audit" },
    { to: "/sulh", icon: "sulh", key: "sulh" },
    { to: "/notifications", icon: "notifications", key: "notifications" },
  ]},
];

const groupLabels: Record<string, Record<string, string>> = {
  main: { en: "Main", ar: "الرئيسية", fr: "Principal" },
  products: { en: "Finance", ar: "التمويل", fr: "Finance" },
  charity: { en: "Charity", ar: "الصدقة", fr: "Charite" },
  tools: { en: "Tools", ar: "الأدوات", fr: "Outils" },
  personal: { en: "Personal", ar: "شخصي", fr: "Personnel" },
  system: { en: "System", ar: "النظام", fr: "Systeme" },
};

const languages = [
  { code: "en", label: "EN" },
  { code: "ar", label: "عر" },
  { code: "fr", label: "FR" },
];

export default function Sidebar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const lang = i18n.language?.substring(0, 2) || "en";
  const isActive = (path: string) => location.pathname === path;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center text-primary-900 font-bold text-sm shadow-lg flex-shrink-0">
          IF
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">IslamicFinance</p>
            <p className="text-primary-400 text-[10px]">Open Source</p>
          </div>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2 space-y-3 scrollbar-thin">
        {menuGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-primary-500 uppercase tracking-widest">
                {groupLabels[group.label]?.[lang] || group.label}
              </p>
            )}
            {collapsed && <div className="border-t border-primary-700 my-1 mx-2" />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? t(`nav.${item.key}`) : undefined}
                  className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                    isActive(item.to)
                      ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-900/30 font-medium"
                      : "text-primary-300 hover:bg-primary-700/60 hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 ${isActive(item.to) ? "" : "group-hover:scale-110"}`} />
                  {!collapsed && <span className="truncate">{t(`nav.${item.key}`)}</span>}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Admin */}
        {/* Employee & Admin */}
        {user && (
          <div>
            {!collapsed && <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gold-500 uppercase tracking-widest">{t("nav.employee") || "Staff"}</p>}
            {collapsed && <div className="border-t border-gold-700/30 my-1 mx-2" />}
            <Link to="/employee" onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                isActive("/employee") ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow" : "text-gold-400 hover:bg-primary-700/60"}`}>
              <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              {!collapsed && <span>{t("nav.employee") || "Employee Portal"}</span>}
            </Link>
            {user.is_admin && (
              <Link to="/admin" onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 ${
                  isActive("/admin") ? "bg-gold-600 text-white shadow" : "text-gold-400 hover:bg-primary-700/60"}`}>
                <Icon name="admin" className="w-[18px] h-[18px]" />
                {!collapsed && <span>Admin Panel</span>}
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Bottom controls */}
      <div className="p-3 border-t border-primary-700 space-y-1">
        {/* Settings */}
        <Link to="/settings" onClick={() => setMobileOpen(false)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all ${isActive("/settings") ? "bg-primary-600 text-white" : "text-primary-300 hover:bg-primary-700/60 hover:text-white"}`}>
          <Icon name="admin" className="w-[18px] h-[18px]" />
          {!collapsed && <span>{t("nav.settings")}</span>}
        </Link>

        {/* Help */}
        <Link to="/help" onClick={() => setMobileOpen(false)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all ${isActive("/help") ? "bg-primary-600 text-white" : "text-primary-300 hover:bg-primary-700/60 hover:text-white"}`}>
          <Icon name="help" className="w-[18px] h-[18px]" />
          {!collapsed && <span>{t("nav.help")}</span>}
        </Link>

        {/* Auth */}
        {user ? (
          <button onClick={() => { logout(); setMobileOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-red-400 hover:bg-red-900/30 transition-all">
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            {!collapsed && <span>{t("nav.logout")}</span>}
          </button>
        ) : (
          <div className="space-y-1">
            <Link to="/login" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-[13px] text-primary-200 hover:bg-primary-700 rounded-lg text-center">{t("nav.login")}</Link>
            <Link to="/register" onClick={() => setMobileOpen(false)}
              className="block px-3 py-2 text-[13px] bg-gold-500 text-primary-900 font-medium rounded-lg text-center hover:bg-gold-400 transition-all">{t("nav.register")}</Link>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={`hidden lg:flex flex-col bg-primary-800 dark:bg-gray-900 fixed top-0 left-0 h-screen z-40 transition-all duration-300 border-r border-primary-700/50 ${collapsed ? "w-[60px]" : "w-[220px]"}`}>
        <NavContent />
        <button onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-primary-600 border-2 border-primary-500 rounded-full flex items-center justify-center text-white text-[10px] hover:bg-primary-500 shadow-lg transition-all duration-200 hover:scale-110">
          {collapsed ? "\u203A" : "\u2039"}
        </button>
      </aside>

      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 bg-primary-800 text-white p-2.5 rounded-xl shadow-lg hover:bg-primary-700 transition-all">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setMobileOpen(false)} />
          <aside className="lg:hidden fixed top-0 left-0 w-[260px] h-screen bg-primary-800 dark:bg-gray-900 z-50 shadow-2xl animate-slide-in">
            <button onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-primary-400 hover:text-white p-1 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <NavContent />
          </aside>
        </>
      )}

      {/* Spacer */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${collapsed ? "w-[60px]" : "w-[220px]"}`} />
    </>
  );
}
