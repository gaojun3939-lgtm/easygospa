import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PageHead from "@/components/global/PageHead";
import { alternatesFor } from "@/i18n/routing";

// 2026-10-26 老板定(重新申请 Xendit 前全站清模板残留):原来列着 Gallery / Our Team(假页面,已下线)
// 和美容、激光脱毛、美甲、美发、Japanese Head Spa(我们没有)。现在只列真页面和后台在售的 6 个按摩项目,
// 项目名照后台原样,点了去价目表;后台改名 / 加项目时这里要跟着改。
const MAIN_PAGES = [
  { key: "home", url: "/" },
  { key: "services", url: "/services" },
  { key: "pricing", url: "/pricing" },
  { key: "contact", url: "/contact" },
  { key: "terms", url: "/terms-of-service" },
  { key: "privacy", url: "/privacy-policy" },
];
const TREATMENTS = ["Deep tissue", "Hot Stone Massage", "Relaxing Premium Aromatherapy Body Massage", "Shiatsu Massage(without Oil)", "Swedish Massage", "Thai Body Massage"];

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.sitemap" });
  return { title: t("title"), alternates: alternatesFor(locale, "/sitemap") };
}

export default async function Sitemap({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "sitemapPage" });
  const tn = await getTranslations({ locale, namespace: "serviceNames" });
  const sections = [
    { title: t("main"), pages: MAIN_PAGES.map((page) => ({ url: page.url, name: t(`pages.${page.key}.name`), description: t(`pages.${page.key}.description`) })) },
    { title: t("treatments"), pages: TREATMENTS.map((name) => ({ url: "/pricing", name: tn.has(name) ? tn(name) : name, description: t(`treatmentNotes.${name}`) })) },
  ];

  return (
    <div className="ga ga-page">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        {t("lead")}
      </PageHead>

      {sections.map((section) => (
        <section className="ga-wrap ga-page-sec ga-sitemap" key={section.title}>
          <h2 className="ga-sec-title">{section.title}</h2>
          <div className="ga-links">
            {section.pages.map((page) => (
              <Link className="ga-link" href={page.url} key={page.name}>
                <b>{page.name}</b>
                <span>{page.description}</span>
                <small>{page.url}</small>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="ga-wrap ga-page-sec ga-sitemap ga-sitemap-end">
        <h2 className="ga-sec-title">{t("about")}</h2>
        <div className="ga-about">
          <div>
            <h3>{t("features")}</h3>
            <ul>
              {["responsive", "booking", "menu", "tracking", "contact"].map((key) => <li key={key}>{t(`featureList.${key}`)}</li>)}
            </ul>
          </div>
          <div>
            <h3>{t("office")}</h3>
            {/* 公司名、地址不翻译，跟页脚一致 */}
            <ul>
              <li>EASYGOSPA HOME MASSAGE SERVICES OPC</li>
              <li>Unit 706, Medical Towers Makati, 103 Rufino Street,</li>
              <li>Legazpi Village, Bel-Air, Makati City, Metro Manila 1209</li>
              <li>{t("homeOnly")}</li>
              <li className="ga-page-note">{t("phone", { phone: "+63 964 857 0967" })}</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ga-cta">
        <div className="ga-wrap">
          <h2>{t("ctaTitle")}</h2>
          <p>{t("ctaText")}</p>
          <button type="button" className="ga-btn ga-btn-big ga-btn-light" data-open-booking="1">
            {t("ctaButton")}
          </button>
        </div>
      </section>
    </div>
  );
}
