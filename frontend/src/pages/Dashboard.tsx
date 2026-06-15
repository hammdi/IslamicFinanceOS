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
          {/* Top row: Wallet + Credit Score */}
          <div className="grid md:grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
            <Link to="/wallet" className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <p className="text-xs opacity-80">{t("dashboard.balance")}</p>
              <p className="text-3xl font-bold mt-1">{stats.wallet_balance?.toFixed(2)} <span className="text-lg opacity-70">USD</span></p>
            </Link>
            <Link to="/credit-score" className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-5 text-white shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              <p className="text-xs opacity-80">{t("nav.creditscore")}</p>
              <p className="text-3xl font-bold mt-1">{stats.credit_score} <span className="text-lg opacity-70">/ 1000</span></p>
            </Link>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 max-w-5xl mx-auto stagger-children">
            {[
              { val: stats.qard?.count, label: t("nav.qard"), color: "text-emerald-600", path: "/qard" },
              { val: stats.musharaka?.investments, label: t("nav.musharaka"), color: "text-blue-600", path: "/musharaka" },
              { val: stats.tontine?.memberships, label: t("nav.tontine"), color: "text-amber-600", path: "/tontine" },
              { val: stats.murabaha?.contracts, label: t("nav.murabaha"), color: "text-teal-600", path: "/murabaha" },
              { val: stats.takaful?.pools, label: t("nav.takaful"), color: "text-rose-600", path: "/takaful" },
              { val: stats.sukuk?.holdings, label: t("nav.sukuk"), color: "text-violet-600", path: "/sukuk" },
              { val: `${stats.zakat?.total_given?.toFixed(0) || 0}$`, label: t("nav.zakat"), color: "text-green-600", path: "/zakat" },
              { val: `${stats.waqf?.total_donated?.toFixed(0) || 0}$`, label: t("nav.waqf"), color: "text-purple-600", path: "/waqf" },
              { val: `${stats.sadaqa?.total_donated?.toFixed(0) || 0}$`, label: t("nav.sadaqa"), color: "text-pink-600", path: "/sadaqa" },
              { val: stats.hawala?.transfers, label: t("nav.hawala"), color: "text-cyan-600", path: "/hawala" },
              { val: stats.savings_goals, label: t("nav.family"), color: "text-orange-600", path: "/family" },
              { val: stats.transactions, label: t("nav.transactions"), color: "text-gray-600", path: "/transactions" },
            ].map((s, i) => (
              <Link key={i} to={s.path} className="bg-white rounded-xl shadow p-3 text-center animate-count-up card-hover">
                <p className={`text-lg font-bold ${s.color}`}>{s.val}</p>
                <p className="text-[10px] text-gray-500 truncate">{s.label}</p>
              </Link>
            ))}
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
