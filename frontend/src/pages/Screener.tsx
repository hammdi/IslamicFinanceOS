import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

export default function Screener() {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: "", ticker: "", sector: "", country: "",
    debt_to_assets: "0", interest_income_ratio: "0", receivables_to_assets: "0",
    business_activities: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.allCompanies().then(setCompanies).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api.screenCompany({
        name: form.name, ticker: form.ticker || undefined,
        sector: form.sector || undefined, country: form.country || undefined,
        debt_to_assets: parseFloat(form.debt_to_assets),
        interest_income_ratio: parseFloat(form.interest_income_ratio),
        receivables_to_assets: parseFloat(form.receivables_to_assets),
        business_activities: form.business_activities ? form.business_activities.split(",").map(s => s.trim()) : [],
      });
      setResult(r);
      api.allCompanies().then(setCompanies);
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  const statusColor = (s: string) =>
    s === "halal" ? "bg-green-100 text-green-800 border-green-300" :
    s === "haram" ? "bg-red-100 text-red-800 border-red-300" :
    "bg-yellow-100 text-yellow-800 border-yellow-300";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("screener.title")}</h1>

      {message && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">{message}</div>
      )}

      {/* Screen Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("screener.check")}</h2>
        <form onSubmit={handleScreen} className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("screener.company_name")}</label>
            <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("screener.ticker")}</label>
            <input type="text" value={form.ticker} onChange={(e) => setForm(f => ({ ...f, ticker: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g. AAPL" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("screener.debt_ratio")}</label>
            <input type="number" value={form.debt_to_assets} onChange={(e) => setForm(f => ({ ...f, debt_to_assets: e.target.value }))} min="0" step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("screener.interest_ratio")}</label>
            <input type="number" value={form.interest_income_ratio} onChange={(e) => setForm(f => ({ ...f, interest_income_ratio: e.target.value }))} min="0" step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("screener.receivables_ratio")}</label>
            <input type="number" value={form.receivables_to_assets} onChange={(e) => setForm(f => ({ ...f, receivables_to_assets: e.target.value }))} min="0" step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t("screener.activities")}</label>
            <input type="text" value={form.business_activities} onChange={(e) => setForm(f => ({ ...f, business_activities: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g. technology, retail" /></div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-8 rounded-lg">{t("screener.screen")}</button></div>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl border-2 p-6 ${statusColor(result.halal_status)}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{result.halal_status === "halal" ? "✅" : result.halal_status === "haram" ? "❌" : "⚠️"}</span>
            <div>
              <h3 className="text-xl font-bold">{result.name} {result.ticker && `(${result.ticker})`}</h3>
              <p className="text-lg font-semibold capitalize">{result.halal_status}</p>
            </div>
          </div>
          {result.screening_report?.criteria && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {Object.entries(result.screening_report.criteria).map(([k, v]) => (
                <div key={k} className="flex items-center gap-2 text-sm">
                  <span>{v ? "✅" : "❌"}</span>
                  <span>{k.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          )}
          {result.screening_report?.issues?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <p className="font-medium text-sm mb-1">{t("screener.issues")}:</p>
              {result.screening_report.issues.map((issue: string, i: number) => (
                <p key={i} className="text-sm">• {issue}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Companies */}
      {companies.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("screener.screened_companies")}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {companies.map(c => (
              <div key={c.id} className={`rounded-lg border p-4 ${statusColor(c.halal_status)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    {c.ticker && <p className="text-xs opacity-70">{c.ticker}</p>}
                  </div>
                  <span className="text-sm font-bold capitalize">{c.halal_status}</span>
                </div>
                {c.sector && <p className="text-xs mt-1 opacity-70">{c.sector}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
