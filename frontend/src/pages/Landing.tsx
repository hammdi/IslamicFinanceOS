import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const features = [
  { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "from-emerald-400 to-emerald-600", key: "qard" },
  { icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", color: "from-blue-400 to-blue-600", key: "musharaka" },
  { icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color: "from-amber-400 to-amber-600", key: "tontine" },
  { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "from-rose-400 to-rose-600", key: "takaful" },
  { icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", color: "from-green-400 to-green-600", key: "zakat" },
  { icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "from-cyan-400 to-cyan-600", key: "hawala" },
];

const stats = [
  { value: "20+", label: "products" },
  { value: "118", label: "api_endpoints" },
  { value: "3", label: "languages" },
  { value: "0%", label: "interest" },
];

export default function Landing() {
  const { t, i18n } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center text-primary-900 font-bold shadow-lg">IF</div>
          <span className="text-white font-bold text-lg">IslamicFinance OS</span>
        </div>
        <div className="flex items-center gap-3">
          <select value={i18n.language} onChange={(e) => { i18n.changeLanguage(e.target.value); document.documentElement.dir = e.target.value === "ar" ? "rtl" : "ltr"; }}
            className="bg-primary-700 text-white text-sm rounded-lg px-3 py-1.5 border border-primary-600">
            <option value="en">English</option><option value="ar">العربية</option><option value="fr">Francais</option>
          </select>
          <Link to="/login" className="text-primary-200 hover:text-white text-sm px-4 py-2">{t("nav.login")}</Link>
          <Link to="/register" className="bg-gold-500 hover:bg-gold-400 text-primary-900 font-medium text-sm px-5 py-2 rounded-xl transition-all hover:shadow-lg hover:shadow-gold-500/20">{t("nav.register")}</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <div className="animate-fade-in">
          <p className="text-gold-400 text-sm font-semibold tracking-widest uppercase mb-4">{t("landing.open_source")}</p>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            {t("landing.hero_title")}
          </h1>
          <p className="text-xl text-primary-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t("landing.hero_subtitle")}
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="bg-gold-500 hover:bg-gold-400 text-primary-900 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-xl hover:shadow-gold-500/30 hover:-translate-y-0.5">
              {t("landing.get_started")}
            </Link>
            <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer"
              className="border-2 border-primary-400 text-primary-200 hover:text-white hover:border-white px-8 py-4 rounded-xl text-lg transition-all">
              {t("landing.api_docs")}
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-gold-400">{s.value}</p>
              <p className="text-xs text-primary-400 uppercase tracking-wide mt-1">{t(`landing.${s.label}`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-4">{t("landing.features_title")}</h2>
        <p className="text-primary-300 text-center mb-12 max-w-xl mx-auto">{t("landing.features_subtitle")}</p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.key} className="bg-primary-800/50 backdrop-blur border border-primary-700/50 rounded-2xl p-6 hover:border-primary-500/50 transition-all duration-300 hover:-translate-y-1 group">
              <div className={`w-12 h-12 bg-gradient-to-br ${f.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={f.icon} /></svg>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{t(`dashboard.${f.key}_title`)}</h3>
              <p className="text-primary-300 text-sm leading-relaxed">{t(`dashboard.${f.key}_desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">{t("landing.how_title")}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="text-center">
              <div className="w-14 h-14 bg-gold-500 text-primary-900 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">{step}</div>
              <h3 className="text-white font-semibold mb-2">{t(`landing.step${step}_title`)}</h3>
              <p className="text-primary-300 text-sm">{t(`landing.step${step}_desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/20 border border-gold-500/30 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">{t("landing.cta_title")}</h2>
          <p className="text-primary-200 mb-8 max-w-lg mx-auto">{t("landing.cta_subtitle")}</p>
          <Link to="/register" className="bg-gold-500 hover:bg-gold-400 text-primary-900 font-bold px-10 py-4 rounded-xl text-lg transition-all hover:shadow-xl inline-block">
            {t("landing.cta_button")}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-primary-700 py-8 text-center text-primary-400 text-sm">
        <p>IslamicFinance OS — {t("landing.footer")}</p>
      </footer>
    </div>
  );
}
