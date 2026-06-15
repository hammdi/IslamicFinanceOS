import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-20">
      <h1 className="text-6xl font-bold text-primary-300 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page not found</p>
      <Link
        to="/"
        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg"
      >
        {t("common.back")} &rarr; {t("nav.dashboard")}
      </Link>
    </div>
  );
}
