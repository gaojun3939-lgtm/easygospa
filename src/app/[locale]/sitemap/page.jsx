import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import PageShell from "@/components/site/PageShell";
import { alternatesFor } from "@/i18n/routing";

// 网站目录页（建站模版 serinity 有这一页，换成模版内页的样子）。
// 2026-10-26 重新申请 Xendit 前，模版的假相册、假团队页下线过；11-10 老板要模版的页一样不少，
// 相册（我们的图）和技师页（讲每位技师的标准，不编人）用真内容放回来，这里也列上。
// 项目名照后台原样，点了去价目表；后台改名 / 加项目时这里要跟着改。
const MAIN_PAGES = [
  { key: "home", url: "/" },
  { key: "services", url: "/services" },
  { key: "pricing", url: "/pricing" },
  { key: "stores", url: "/stores" },
  { key: "gallery", url: "/gallery" },
  { key: "team", url: "/team" },
  { key: "coverage", url: "/coverage" },
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
    <PageShell
      pill={t("eyebrow")}
      title={t("title")}
      lead={t("lead")}
      image="/global/photos/closing-corridor.webp"
      cta={{ title: t("ctaTitle"), text: t("ctaText"), button: t("ctaButton") }}
    >
      {sections.map((section) => (
        <section key={section.title} className="mb-14 animate-fadeInUp">
          <h2 className="font-serif text-3xl text-[#0F0F0F] mb-6">{section.title}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {section.pages.map((page) => (
              <Link key={page.name} href={page.url} className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <span className="flex items-center justify-between gap-3 mb-2">
                  <b className="font-serif text-xl font-normal text-[#0F0F0F] group-hover:text-[#55633F]">{page.name}</b>
                  <ArrowRight className="w-4 h-4 text-[#64734F] group-hover:translate-x-1 transition-transform duration-300 flex-shrink-0" aria-hidden="true" />
                </span>
                <span className="block text-sm text-gray-600 leading-relaxed">{page.description}</span>
                <small className="block text-xs text-gray-400 mt-3">{page.url}</small>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="animate-fadeInUp">
        <h2 className="font-serif text-3xl text-[#0F0F0F] mb-6">{t("about")}</h2>
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-serif text-xl text-[#0F0F0F] mb-4">{t("features")}</h3>
            <ul className="space-y-2 text-gray-600 list-disc pl-5">
              {["responsive", "booking", "menu", "tracking", "contact"].map((key) => <li key={key}>{t(`featureList.${key}`)}</li>)}
            </ul>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-serif text-xl text-[#0F0F0F] mb-4">{t("office")}</h3>
            {/* 公司名、地址不翻译，跟页脚一致 */}
            <ul className="space-y-1 text-gray-600">
              <li>EASYGOSPA HOME MASSAGE SERVICES OPC</li>
              <li>Unit 706, Medical Towers Makati, 103 Rufino Street,</li>
              <li>Legazpi Village, Bel-Air, Makati City, Metro Manila 1209</li>
              <li className="pt-2">{t("homeOnly")}</li>
              <li className="text-[#55633F]">{t("phone", { phone: "+63 964 857 0967" })}</li>
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
