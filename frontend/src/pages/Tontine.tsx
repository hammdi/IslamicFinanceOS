import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Spinner from "../components/Spinner";

export default function Tontine() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tontines, setTontines] = useState<any[]>([]);
  const [myTontines, setMyTontines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", monthly_amount: "", members_count: "" });
  const [message, setMessage] = useState("");

  const loadData = () => {
    setLoading(true);
    Promise.all([api.listTontines(), api.myTontines()])
      .then(([available, mine]) => { setTontines(available); setMyTontines(mine); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createTontine({
        name: form.name,
        monthly_amount: parseFloat(form.monthly_amount),
        members_count: parseInt(form.members_count),
      });
      setForm({ name: "", monthly_amount: "", members_count: "" });
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handleJoin = async (tontineId: string) => {
    try {
      await api.joinTontine(tontineId);
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  const handlePay = async (tontine: any) => {
    try {
      await api.payTontine(tontine.id, { amount: tontine.monthly_amount });
      setMessage(t("common.success"));
      loadData();
    } catch (err: any) { setMessage(err.message); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-800">{t("tontine.title")}</h1>

      {message && (
        <div className="bg-primary-50 text-primary-700 p-3 rounded-lg text-sm">
          {message}
          <button onClick={() => setMessage("")} className="float-right text-primary-400 hover:text-primary-600">&times;</button>
        </div>
      )}

      {/* Create Tontine */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("tontine.create")}</h2>
        <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tontine.name")}</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tontine.monthly")}</label>
            <input type="number" value={form.monthly_amount} onChange={(e) => setForm((f) => ({ ...f, monthly_amount: e.target.value }))} required min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("tontine.members")}</label>
            <input type="number" value={form.members_count} onChange={(e) => setForm((f) => ({ ...f, members_count: e.target.value }))} required min="5" max="20"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg">
              {t("tontine.submit")}
            </button>
          </div>
        </form>
      </div>

      {/* My Tontines */}
      {myTontines.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("nav.tontine")} — {user?.name}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {myTontines.map((tontine) => {
              const myMember = tontine.members?.find((m: any) => m.user_id === user?.id);
              const currentRecipient = tontine.members?.find((m: any) => m.payout_order === tontine.current_cycle);
              const isMyTurn = currentRecipient?.user_id === user?.id;

              return (
                <div key={tontine.id} className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${isMyTurn ? "border-green-500 bg-green-50" : "border-amber-500"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{tontine.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tontine.status === "active" ? "bg-green-100 text-green-800" :
                      tontine.status === "completed" ? "bg-gray-100 text-gray-800" :
                      "bg-amber-100 text-amber-800"
                    }`}>{tontine.status}</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{t("tontine.monthly")}: <strong>{tontine.monthly_amount} USD</strong></p>
                    <p>{t("tontine.members_joined")}: {tontine.members?.length || 0} / {tontine.members_count}</p>
                    {tontine.status === "active" && (
                      <>
                        <p>{t("tontine.cycle")}: <strong>{tontine.current_cycle}</strong> / {tontine.members_count}</p>
                        {myMember?.payout_order && (
                          <p className="text-xs text-gray-400">Your payout order: #{myMember.payout_order}</p>
                        )}
                        {isMyTurn && (
                          <p className="text-green-700 font-semibold mt-1">It's your turn to receive!</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Members list */}
                  {tontine.members?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">Members</p>
                      <div className="flex flex-wrap gap-1">
                        {tontine.members.map((m: any) => (
                          <span key={m.id} className={`px-2 py-0.5 rounded text-xs ${
                            m.user_id === user?.id ? "bg-primary-100 text-primary-700 font-medium" :
                            m.has_received ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"
                          }`}>
                            #{m.payout_order || "?"} {m.user_id === user?.id ? "You" : m.user_id.slice(0, 6)}
                            {m.has_received ? " (paid)" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {tontine.status === "active" && (
                    <button onClick={() => handlePay(tontine)}
                      className="mt-4 w-full bg-primary-600 hover:bg-primary-700 text-white text-sm py-2 rounded-lg">
                      {t("tontine.pay")} ({tontine.monthly_amount} USD)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Tontines to join */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t("tontine.available")}</h2>
        {tontines.length === 0 ? (
          <p className="text-gray-500 text-center py-8">{t("tontine.no_groups")}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {tontines.map((tontine) => (
              <div key={tontine.id} className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500">
                <h3 className="font-semibold text-lg">{tontine.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>{t("tontine.monthly")}: {tontine.monthly_amount} USD</p>
                  <p>{t("tontine.members_joined")}: {tontine.members?.length || 0} / {tontine.members_count}</p>
                </div>
                <button onClick={() => handleJoin(tontine.id)}
                  className="mt-4 bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-lg">
                  {t("tontine.join")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
