import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

const products = [
  { key: "qard", path: "/qard", color: "from-emerald-500 to-emerald-700" },
  { key: "musharaka", path: "/musharaka", color: "from-blue-500 to-blue-700" },
  { key: "tontine", path: "/tontine", color: "from-amber-500 to-amber-700" },
  { key: "murabaha", path: "/murabaha", color: "from-teal-500 to-teal-700" },
  { key: "ijara", path: "/ijara", color: "from-orange-500 to-orange-700" },
  { key: "zakat", path: "/zakat", color: "from-green-600 to-green-800" },
  { key: "waqf", path: "/waqf", color: "from-purple-500 to-purple-700" },
  { key: "sadaqa", path: "/sadaqa", color: "from-pink-500 to-pink-700" },
  { key: "screener", path: "/screener", color: "from-indigo-500 to-indigo-700" },
];

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      api.dashboardStats().then(setStats).catch(console.error).finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-primary-800 mb-3">{t("dashboard.welcome")}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t("dashboard.description")}</p>
        <p className="text-primary-600 font-medium mt-2">{t("app.tagline")}</p>
      </div>

      {/* User Stats */}
      {user && loading && <Spinner />}
      {user && stats && (
        <div className="mb-10">
          {/* Wallet Balance Hero */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white text-center mb-6 max-w-md mx-auto shadow-lg">
            <p className="text-sm opacity-80">{t("dashboard.balance")}</p>
            <p className="text-4xl font-bold mt-1">{stats.wallet_balance?.toFixed(2)} <span className="text-xl opacity-70">USD</span></p>
            <Link to="/wallet" className="inline-block mt-3 bg-white/20 hover:bg-white/30 px-4 py-1 rounded text-sm">
              {t("nav.wallet")}
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto stagger-children">
            <div className="bg-white rounded-xl shadow p-3 text-center">
              <p className="text-xl font-bold text-emerald-600">{stats.qard?.loans_requested}</p>
              <p className="text-xs text-gray-500">{t("nav.qard")}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-3 text-center">
              <p className="text-xl font-bold text-blue-600">{stats.musharaka?.investments_made}</p>
              <p className="text-xs text-gray-500">{t("nav.musharaka")}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-3 text-center">
              <p className="text-xl font-bold text-amber-600">{stats.tontine?.memberships}</p>
              <p className="text-xs text-gray-500">{t("nav.tontine")}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-3 text-center">
              <p className="text-xl font-bold text-green-600">{stats.zakat?.total_given?.toFixed(0)}</p>
              <p className="text-xs text-gray-500">{t("nav.zakat")}</p>
            </div>
            <div className="bg-white rounded-xl shadow p-3 text-center">
              <p className="text-xl font-bold text-purple-600">{stats.waqf?.total_donated?.toFixed(0)}</p>
              <p className="text-xs text-gray-500">{t("nav.waqf")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Product Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto stagger-children">
        {products.map((product) => (
          <Link key={product.key} to={user ? product.path : "/login"} className="group animate-fade-in-up">
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-primary-300 h-full hover:-translate-y-1">
              <div className={`bg-gradient-to-r ${product.color} p-4 text-white text-center`}>
                <h2 className="text-lg font-bold">{t(`dashboard.${product.key}_title`)}</h2>
                <p className="text-xs opacity-90">{t(`dashboard.${product.key}_subtitle`)}</p>
              </div>
              <div className="p-4">
                <p className="text-gray-600 text-xs leading-relaxed">{t(`dashboard.${product.key}_desc`)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {!user && (
        <div className="text-center mt-12">
          <Link to="/register"
            className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium px-8 py-3 rounded-lg transition-colors">
            {t("nav.register")}
          </Link>
        </div>
      )}
    </div>
  );
}
