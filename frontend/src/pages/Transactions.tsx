import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

const typeColors: Record<string, string> = {
  qard_fund: "bg-emerald-100 text-emerald-800",
  qard_repay: "bg-green-100 text-green-800",
  musharaka_invest: "bg-blue-100 text-blue-800",
  musharaka_profit: "bg-indigo-100 text-indigo-800",
  musharaka_loss: "bg-red-100 text-red-800",
  tontine_contribute: "bg-amber-100 text-amber-800",
  tontine_payout: "bg-yellow-100 text-yellow-800",
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
      <h1 className="text-3xl font-bold text-primary-800">
        {t("transactions.title")}
      </h1>

      <div className="flex gap-2">
        {["", "qard", "musharaka", "tontine"].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === type
                ? "bg-primary-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
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
