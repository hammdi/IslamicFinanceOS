import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";

const typeColors: Record<string, string> = {
  deposit: "bg-green-100 text-green-800",
  withdraw: "bg-red-100 text-red-800",
  transfer: "bg-blue-100 text-blue-800",
  qard_fund: "bg-emerald-100 text-emerald-800",
  qard_repay: "bg-green-100 text-green-800",
  musharaka_invest: "bg-blue-100 text-blue-800",
  musharaka_profit: "bg-indigo-100 text-indigo-800",
  musharaka_loss: "bg-red-100 text-red-800",
  tontine_contribute: "bg-amber-100 text-amber-800",
  tontine_payout: "bg-yellow-100 text-yellow-800",
  murabaha_payment: "bg-teal-100 text-teal-800",
  ijara_rent: "bg-orange-100 text-orange-800",
  ijara_purchase: "bg-orange-100 text-orange-800",
  takaful_contribute: "bg-rose-100 text-rose-800",
  hawala_send: "bg-cyan-100 text-cyan-800",
  sukuk_buy: "bg-violet-100 text-violet-800",
  sukuk_return: "bg-violet-100 text-violet-800",
  zakat_distribute: "bg-green-100 text-green-800",
  waqf_donate: "bg-purple-100 text-purple-800",
  sadaqa_donate: "bg-pink-100 text-pink-800",
  marketplace_buy: "bg-gray-100 text-gray-800",
};

export default function Transactions() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .listTransactions(filter || undefined)
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("transactions.title")}
        description="Complete history of all your financial movements. Every transaction is auditable with a blockchain hash."
        icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        color="from-gray-600 to-gray-800" />

      <div className="flex gap-2 flex-wrap">
        {["", "wallet", "qard", "musharaka", "tontine", "murabaha", "ijara", "takaful", "hawala", "sukuk", "zakat", "waqf", "sadaqa", "marketplace"].map((type) => (
          <button
            key={type}
            onClick={() => { setLoading(true); setFilter(type); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === type
                ? "bg-primary-600 text-white shadow"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {type === ""
              ? t("transactions.all")
              : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          {t("transactions.no_transactions")}
        </p>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("transactions.type")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("transactions.amount")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("transactions.from")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("transactions.to")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("transactions.date")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t("transactions.audit")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        typeColors[tx.type] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">{tx.amount} USD</td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {tx.from_user?.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {tx.to_user?.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400 font-mono">
                    {tx.hashgraph_tx_id || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
