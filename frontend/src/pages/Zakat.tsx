import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

const CATEGORIES = ["poor", "needy", "zakat_workers", "new_muslims", "debtors", "fi_sabilillah", "travelers"];

export default function Zakat() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [distributions, setDistributions] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    cash_and_savings: "", investments: "", gold_silver_value: "",
    business_assets: "", debts_owed_to_you: "", debts_you_owe: "", expenses: "",
  });
  const [distForm, setDistForm] = useState({ amount: "", category: "poor", description: "" });

  useEffect(() => {
    api.zakatHistory().then(setHistory).catch(console.error);
    api.zakatDistributions().then(setDistributions).catch(console.error);
  }, []);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.calculateZakat({
        cash_and_savings: parseFloat(form.cash_and_savings || "0"),
        investments: parseFloat(form.investments || "0"),
        gold_silver_value: parseFloat(form.gold_silver_value || "0"),
        business_assets: parseFloat(form.business_assets || "0"),
        debts_owed_to_you: parseFloat(form.debts_owed_to_you || "0"),
        debts_you_owe: parseFloat(form.debts_you_owe || "0"),
        expenses: parseFloat(form.expenses || "0"),
      });
      setResult(r);
      setHistory((h) => [r, ...h]);
    } catch (err: any) { setMessage(err.message); }
    setLoading(false);
  };

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    try {
      await api.distributeZakat({
        calculation_id: result.id,
        amount: parseFloat(distForm.amount),
        category: distForm.category,
        description: distForm.description,
      });
      setDistForm({ amount: "", category: "poor", description: "" });
      setMessage(t("common.success"));
      api.zakatDistributions().then(setDistributions);
    } catch (err: any) { setMessage(err.message); }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("zakat.title")}</h1>

      {message && (
        <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">
          {message}
          <button onClick={() => setMessage("")} className="float-right">&times;</button>
        </div>
      )}

      {/* Calculator */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("zakat.calculator")}</h2>
        <form onSubmit={handleCalculate} className="grid md:grid-cols-2 gap-4">
          {[
            ["cash_and_savings", "cash"], ["investments", "investments"],
            ["gold_silver_value", "gold_silver"], ["business_assets", "business"],
            ["debts_owed_to_you", "debts_to_you"], ["debts_you_owe", "debts_you_owe"],
            ["expenses", "expenses"],
          ].map(([key, label]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t(`zakat.${label}`)}</label>
              <input type="number" value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                min="0" step="0.01" placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}
          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-8 rounded-lg">
              {loading ? t("common.loading") : t("zakat.calculate")}
            </button>
          </div>
        </form>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl shadow-md p-6 ${result.is_above_nisab ? "bg-emerald-50 border-2 border-emerald-300" : "bg-gray-50 border border-gray-200"}`}>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">{t("zakat.total_eligible")}</p>
              <p className="text-2xl font-bold">{result.total_eligible?.toFixed(2)} USD</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("zakat.nisab")}</p>
              <p className="text-2xl font-bold">{result.nisab_value?.toFixed(2)} USD</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">{t("zakat.zakat_due")}</p>
              <p className="text-3xl font-bold text-emerald-700">{result.zakat_due?.toFixed(2)} USD</p>
            </div>
          </div>
          <p className={`text-center mt-4 font-medium ${result.is_above_nisab ? "text-emerald-700" : "text-gray-500"}`}>
            {result.is_above_nisab ? t("zakat.above_nisab") : t("zakat.below_nisab")}
          </p>
        </div>
      )}

      {/* Distribute */}
      {result?.is_above_nisab && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("zakat.distribute")}</h2>
          <form onSubmit={handleDistribute} className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("wallet.amount")}</label>
              <input type="number" value={distForm.amount} onChange={(e) => setDistForm((f) => ({ ...f, amount: e.target.value }))}
                required min="0.01" step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("zakat.category")}</label>
              <select value={distForm.category} onChange={(e) => setDistForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`zakat.categories.${c}`)}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg">
                {t("zakat.distribute")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Distribution History */}
      {distributions.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("zakat.distributions")}</h2>
          <div className="grid gap-3">
            {distributions.map((d) => (
              <div key={d.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {t(`zakat.categories.${d.category}`)}
                  </span>
                  {d.description && <p className="text-sm text-gray-500 mt-1">{d.description}</p>}
                </div>
                <div className="text-right">
                  <p className="font-semibold">{d.amount} USD</p>
                  <p className="text-xs text-gray-400">{new Date(d.distributed_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
