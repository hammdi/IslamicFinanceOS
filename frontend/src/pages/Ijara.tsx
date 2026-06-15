import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";

export default function Ijara() {
  const { t } = useTranslation();
  const [myContracts, setMyContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ asset_description: "", asset_value: "", monthly_rent: "", lease_duration_months: "24", purchase_option_price: "" });
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    api.myIjara().then(setMyContracts).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(() => { loadData(); }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.requestIjara({
        asset_description: form.asset_description,
        asset_value: parseFloat(form.asset_value),
        monthly_rent: parseFloat(form.monthly_rent),
        lease_duration_months: parseInt(form.lease_duration_months),
        purchase_option_price: parseFloat(form.purchase_option_price),
      });
      setForm({ asset_description: "", asset_value: "", monthly_rent: "", lease_duration_months: "24", purchase_option_price: "" });
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handlePay = async (id: string) => {
    try { await api.payIjara(id); setMessage(t("common.success")); loadData(); }
    catch (err: any) { setMessage(err.message); }
  };

  const handlePurchase = async (id: string) => {
    try { await api.purchaseIjara(id); setMessage(t("common.success")); loadData(); }
    catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader title={t("ijara.title")} description="Lease an asset with option to purchase at end of term. Ownership risk stays with the platform until you buy." icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" color="from-orange-500 to-orange-700" />

      {message && (
        <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">
          {message}<button onClick={() => setMessage("")} className="float-right">&times;</button>
        </div>
      )}

      {/* Request Form */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("ijara.request")}</h2>
        <form onSubmit={handleRequest} className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("ijara.asset")}</label>
            <input type="text" value={form.asset_description} onChange={(e) => setForm(f => ({ ...f, asset_description: e.target.value }))} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="e.g. Office Space - Downtown" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("ijara.asset_value")}</label>
            <input type="number" value={form.asset_value} onChange={(e) => setForm(f => ({ ...f, asset_value: e.target.value }))} required min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("ijara.monthly_rent")}</label>
            <input type="number" value={form.monthly_rent} onChange={(e) => setForm(f => ({ ...f, monthly_rent: e.target.value }))} required min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("ijara.duration")}</label>
            <input type="number" value={form.lease_duration_months} onChange={(e) => setForm(f => ({ ...f, lease_duration_months: e.target.value }))} required min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("ijara.purchase_price")}</label>
            <input type="number" value={form.purchase_option_price} onChange={(e) => setForm(f => ({ ...f, purchase_option_price: e.target.value }))} required min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-8 rounded-lg">{t("ijara.submit")}</button>
          </div>
        </form>
      </div>

      {/* My Contracts */}
      {myContracts.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("ijara.my_contracts")}</h2>
          <div className="grid gap-4">
            {myContracts.map((c) => {
              const paid = c.payments?.filter((p: any) => p.status === "paid").length || 0;
              const progress = c.lease_duration_months > 0 ? (paid / c.lease_duration_months) * 100 : 0;
              return (
                <div key={c.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{c.asset_description}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === "purchased" ? "bg-green-100 text-green-800" :
                          c.status === "completed" ? "bg-blue-100 text-blue-800" :
                          c.status === "active" ? "bg-orange-100 text-orange-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>{c.status}</span>
                      </div>
                      <p className="text-sm text-gray-500">{t("ijara.monthly_rent")}: {c.monthly_rent} USD | {t("ijara.purchase_price")}: {c.purchase_option_price} USD</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{t("ijara.payments")}</span><span>{paid} / {c.lease_duration_months}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {(c.status === "approved" || c.status === "active") && (
                        <button onClick={() => handlePay(c.id)} className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded-lg">
                          {t("ijara.pay_rent")}
                        </button>
                      )}
                      {c.status === "completed" && (
                        <button onClick={() => handlePurchase(c.id)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg">
                          {t("ijara.purchase")}
                        </button>
                      )}
                    </div>
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
