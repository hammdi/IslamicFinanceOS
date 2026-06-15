import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { dark, toggle } = useTheme();
  const { user } = useAuth();

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-primary-800">{t("settings.title")}</h1>

      {/* Profile */}
      <Section title={t("settings.profile")}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.name?.charAt(0) || "?"}
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${user?.verified ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {user?.verified ? t("settings.verified") : t("settings.unverified")}
            </span>
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section title={t("settings.appearance")}>
        <div className="space-y-4">
          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <div>
                <p className="font-medium text-sm">{t("settings.dark_mode")}</p>
                <p className="text-xs text-gray-400">{t("settings.dark_mode_desc")}</p>
              </div>
            </div>
            <button onClick={toggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${dark ? "bg-primary-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${dark ? "translate-x-6" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-sm">{t("settings.language")}</p>
                <p className="text-xs text-gray-400">{t("settings.language_desc")}</p>
              </div>
            </div>
            <select value={i18n.language} onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              document.documentElement.dir = e.target.value === "ar" ? "rtl" : "ltr";
              document.documentElement.lang = e.target.value;
            }} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="fr">Francais</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Security */}
      <Section title={t("settings.security")}>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="font-medium text-sm">{t("settings.password")}</p>
            </div>
            <button className="text-primary-600 text-sm hover:underline">{t("settings.change")}</button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="font-medium text-sm">{t("settings.two_factor")}</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">{t("settings.coming_soon")}</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
