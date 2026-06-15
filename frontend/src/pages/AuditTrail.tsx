import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

export default function AuditTrail() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    api.listTransactions(filter || undefined)
      .then(setTransactions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-800">{t("audit.title")}</h1>
        <p className="text-gray-600 mt-1">{t("audit.description")}</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "wallet", "qard", "musharaka", "tontine", "zakat", "waqf"].map((type) => (
          <button key={type} onClick={() => { setLoading(true); setFilter(type); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === type ? "bg-primary-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"}`}>
            {type || t("transactions.all")}
          </button>
        ))}
      </div>

      {transactions.length === 0 ? (
        <p className="text-gray-500 text-center py-12">{t("transactions.no_transactions")}</p>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {tx.type}
                  </span>
                  <span className="font-semibold">{tx.amount} USD</span>
                  <span className="text-xs text-gray-400">
                    {new Date(tx.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {tx.hashgraph_tx_id ? (
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      <code className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded font-mono">
                        {tx.hashgraph_tx_id}
                      </code>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">No hash</span>
                  )}
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-gray-400">
                <span>{t("transactions.from")}: <code className="font-mono">{tx.from_user?.slice(0, 12)}...</code></span>
                <span>{t("transactions.to")}: <code className="font-mono">{tx.to_user?.slice(0, 12)}...</code></span>
                <span>ID: <code className="font-mono">{tx.id?.slice(0, 8)}</code></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
