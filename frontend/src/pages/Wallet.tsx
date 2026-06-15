import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import Spinner from "../components/Spinner";
import PageHeader from "../components/PageHeader";
import InfoLabel from "../components/InfoLabel";

export default function Wallet() {
  const { t } = useTranslation();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"deposit" | "withdraw" | "transfer">("deposit");
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    api.getWallet().then(setWallet).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    try {
      if (tab === "deposit") await api.deposit({ amount: parseFloat(amount) });
      else if (tab === "withdraw") await api.withdraw({ amount: parseFloat(amount) });
      else await api.transfer({ to_email: email, amount: parseFloat(amount), note });
      setAmount(""); setEmail(""); setNote("");
      setMessage(t("common.success"));
      load();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={t("wallet.title")}
        description={t("wallet.page_desc") || "Your central wallet for all transactions. Deposit, withdraw, and transfer funds across all Islamic finance products."}
        icon="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
      />

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 text-white shadow-xl">
        <p className="text-sm opacity-80">{t("wallet.balance")}</p>
        <p className="text-5xl font-bold mt-2">{wallet?.balance?.toFixed(2)} <span className="text-2xl opacity-70">USD</span></p>
        <div className="flex gap-8 mt-6 text-sm opacity-80">
          <div>
            <p>{t("wallet.total_deposited")}</p>
            <p className="font-semibold text-lg">{wallet?.total_deposited?.toFixed(2)}</p>
          </div>
          <div>
            <p>{t("wallet.total_withdrawn")}</p>
            <p className="font-semibold text-lg">{wallet?.total_withdrawn?.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {message && (
        <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">
          {message}
          <button onClick={() => setMessage("")} className="float-right">&times;</button>
        </div>
      )}

      {/* Action Tabs */}
      <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
        <div className="flex gap-2 mb-6">
          {(["deposit", "withdraw", "transfer"] as const).map((t2) => (
            <button key={t2} onClick={() => setTab(t2)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${tab === t2 ? "bg-primary-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {t(`wallet.${t2}`)}
            </button>
          ))}
        </div>

        <form onSubmit={handleAction} className="space-y-4">
          <div>
            <InfoLabel label={t("wallet.amount")} info={
              tab === "deposit" ? "Add funds to your wallet from an external source." :
              tab === "withdraw" ? "Withdraw funds from your wallet to an external account." :
              "Amount to send to the recipient."
            } required />
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required min="0.01" step="0.01"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all duration-200 hover:border-primary-300" />
          </div>
          {tab === "transfer" && (
            <>
              <div>
                <InfoLabel label={t("wallet.recipient_email")} info="Enter the email address of the person you want to send money to. They must have an account on this platform." required />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 transition-all duration-200 hover:border-primary-300" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("wallet.note")}</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
              </div>
            </>
          )}
          <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-8 rounded-lg">
            {t(`wallet.${tab}`)}
          </button>
        </form>
      </div>
    </div>
  );
}
