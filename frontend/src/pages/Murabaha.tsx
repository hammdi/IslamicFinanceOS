import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";

export default function Murabaha() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [myContracts, setMyContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ asset_description: "", asset_price: "", platform_margin_percent: "10", installments_count: "12" });
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([api.listMurabaha(), api.myMurabaha()])
      .then(([a, m]) => { setContracts(a); setMyContracts(m); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.requestMurabaha({
        asset_description: form.asset_description,
        asset_price: parseFloat(form.asset_price),
        platform_margin_percent: parseFloat(form.platform_margin_percent),
        installments_count: parseInt(form.installments_count),
      });
      setForm({ asset_description: "", asset_price: "", platform_margin_percent: "10", installments_count: "12" });
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handlePay = async (id: string) => {
    try {
      await api.payMurabaha(id);
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  const price = parseFloat(form.asset_price || "0");
  const margin = parseFloat(form.platform_margin_percent || "0");
  const total = price * (1 + margin / 100);
  const installment = total / parseInt(form.installments_count || "1");

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={t("murabaha.title")} description="The platform buys an asset and sells it to you at a known markup. You pay in installments. No interest — just a transparent fixed profit margin." icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" color="from-teal-500 to-teal-700" />

      {message && (
        <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">
          {message}<button onClick={() => setMessage("")} className="float-right">&times;</button>
        </div>
      )}

      {/* Request Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("murabaha.request")}</h2>
        <form onSubmit={handleRequest} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("murabaha.asset")}</label>
            <input type="text" value={form.asset_description} onChange={(e) => setForm(f => ({ ...f, asset_description: e.target.value }))} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g. Toyota Corolla 2024" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("murabaha.asset_price")}</label>
            <input type="number" value={form.asset_price} onChange={(e) => setForm(f => ({ ...f, asset_price: e.target.value }))} required min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("murabaha.margin")}</label>
            <input type="number" value={form.platform_margin_percent} onChange={(e) => setForm(f => ({ ...f, platform_margin_percent: e.target.value }))} required min="0" step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("murabaha.installments")}</label>
            <input type="number" value={form.installments_count} onChange={(e) => setForm(f => ({ ...f, installments_count: e.target.value }))} required min="1" max="60"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          {price > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">{t("murabaha.total_price")}: <strong>{total.toFixed(2)} USD</strong></p>
              <p className="text-sm text-blue-600">{t("murabaha.monthly")}: {installment.toFixed(2)} USD</p>
            </div>
          )}
          <div className="md:col-span-2">
            <button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-8 rounded-lg">{t("murabaha.submit")}</button>
          </div>
        </form>
      </div>

      {/* My Contracts */}
      {myContracts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("murabaha.my_contracts")}</h2>
          <div className="grid gap-4">
            {myContracts.map((m) => {
              const paid = m.payments?.filter((p: any) => p.status === "paid").length || 0;
              const progress = m.installments_count > 0 ? (paid / m.installments_count) * 100 : 0;
              return (
                <div key={m.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-teal-500">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{m.asset_description}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.status === "completed" ? "bg-green-100 text-green-800" :
                          m.status === "active" ? "bg-blue-100 text-blue-800" :
                          m.status === "approved" ? "bg-teal-100 text-teal-800" :
                          m.status === "rejected" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{m.status}</span>
                      </div>
                      <p className="text-sm text-gray-500">{t("murabaha.asset_price")}: {m.asset_price} | {t("murabaha.margin")}: {m.platform_margin_percent}% | {t("murabaha.total_price")}: {m.total_price}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{t("murabaha.installments")}</span>
                          <span>{paid} / {m.installments_count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                    {(m.status === "approved" || m.status === "active") && (
                      <button onClick={() => handlePay(m.id)} className="bg-teal-600 hover:bg-teal-700 text-white text-sm px-4 py-2 rounded-lg ml-4">
                        {t("murabaha.pay_installment")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
