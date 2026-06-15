import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";
import InfoLabel from "../components/InfoLabel";

export default function QardHasan() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [qards, setQards] = useState<any[]>([]);
  const [myQards, setMyQards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [fundAmounts, setFundAmounts] = useState<Record<string, string>>({});
  const [repayAmounts, setRepayAmounts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([api.listQards(), api.myQards()])
      .then(([available, mine]) => { setQards(available); setMyQards(mine); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.requestQard({ amount: parseFloat(amount), purpose });
      setAmount(""); setPurpose("");
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleFund = async (qardId: string) => {
    try {
      await api.fundQard(qardId, { amount: parseFloat(fundAmounts[qardId]) });
      setFundAmounts((p) => ({ ...p, [qardId]: "" }));
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleRepay = async (qardId: string) => {
    try {
      await api.repayQard(qardId, { amount: parseFloat(repayAmounts[qardId]) });
      setRepayAmounts((p) => ({ ...p, [qardId]: "" }));
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={t("qard.title")}
        description={t("qard.page_desc") || "A benevolent loan where the borrower returns exactly what they received. No interest, no fees — purely a social good."}
        icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 10v1"
        color="from-emerald-500 to-emerald-700"
      />

      {message && (
        <div className="bg-primary-50 text-primary-700 p-4 rounded-xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span className="flex-1">{message}</span>
          <button onClick={() => setMessage("")} className="text-primary-400 hover:text-primary-600">&times;</button>
        </div>
      )}

      {/* Request Form */}
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("qard.request")}</h2>
        <form onSubmit={handleRequest} className="grid md:grid-cols-3 gap-4">
          <div>
            <InfoLabel label={t("qard.amount")} info={t("qard.amount_info") || "The total amount you need to borrow. You will repay exactly this amount — no interest added."} required />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="1" step="0.01"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all duration-200 hover:border-primary-300" />
          </div>
          <div>
            <InfoLabel label={t("qard.purpose")} info={t("qard.purpose_info") || "Explain why you need this loan (education, medical, business, etc). This helps lenders decide."} required />
            <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all duration-200 hover:border-primary-300" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 active:scale-[0.98] text-white font-medium py-2.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md">
              {t("qard.submit")}
            </button>
          </div>
        </form>
      </div>

      {/* My Qards */}
      {myQards.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {t("qard.title").split("—")[0].trim()} — {user?.name}
          </h2>
          <div className="grid gap-4">
            {myQards.map((qard) => {
              const isBorrower = qard.borrower_id === user?.id;
              const canRepay = isBorrower && (qard.status === "funded" || qard.status === "repaying");
              const totalRepaid = qard.repayment_schedule?.total_repaid || 0;
              const repayProgress = qard.amount > 0 ? (totalRepaid / qard.amount) * 100 : 0;

              return (
                <div key={qard.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary-500">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          qard.status === "completed" ? "bg-green-100 text-green-800" :
                          qard.status === "funded" ? "bg-blue-100 text-blue-800" :
                          qard.status === "repaying" ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {qard.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {isBorrower ? t("qard.borrower") : "Lender"}
                        </span>
                      </div>
                      <p className="font-semibold text-lg">{qard.amount} USD</p>
                      <p className="text-gray-600 text-sm">{qard.purpose}</p>
                      {(qard.status === "repaying" || qard.status === "completed") && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{t("qard.repay")}</span>
                            <span>{totalRepaid.toFixed(2)} / {qard.amount}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(repayProgress, 100)}%` }} />
                          </div>
                        </div>
                      )}
                      {qard.contributions?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-2">
                          {qard.contributions.length} contribution(s) — {qard.contributions.reduce((s: number, c: any) => s + c.amount, 0).toFixed(2)} USD
                        </p>
                      )}
                    </div>
                    {canRepay && (
                      <div className="flex items-center gap-2">
                        <input type="number" placeholder={t("qard.repay_amount")}
                          value={repayAmounts[qard.id] || ""}
                          onChange={(e) => setRepayAmounts((p) => ({ ...p, [qard.id]: e.target.value }))}
                          min="1" step="0.01"
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                        <button onClick={() => handleRepay(qard.id)} disabled={!repayAmounts[qard.id]}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg">
                          {t("qard.repay")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Qards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("qard.available")}</h2>
        {qards.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t("qard.no_requests")}</p>
        ) : (
          <div className="grid gap-4">
            {qards.map((qard) => (
              <div key={qard.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-emerald-500">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <p className="font-semibold text-lg">{qard.amount} <span className="text-gray-500 text-sm">USD</span></p>
                    <p className="text-gray-600 mt-1">{qard.purpose}</p>
                    <p className="text-sm text-gray-400 mt-2">{t("qard.status")}: {qard.status}</p>
                  </div>
                  {qard.borrower_id !== user?.id && (
                    <div className="flex items-center gap-2">
                      <input type="number" placeholder={t("qard.fund_amount")}
                        value={fundAmounts[qard.id] || ""}
                        onChange={(e) => setFundAmounts((p) => ({ ...p, [qard.id]: e.target.value }))}
                        min="1" step="0.01"
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <button onClick={() => handleFund(qard.id)} disabled={!fundAmounts[qard.id]}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-sm px-4 py-2 rounded-lg">
                        {t("qard.fund")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
