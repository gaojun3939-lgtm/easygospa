import { getTranslations, setRequestLocale } from "next-intl/server";
import { CONTACT_EMAIL, COMPANY_PHONE } from "@/lib/contactConfig";
import { alternatesFor } from "@/i18n/routing";

// 2026-11-09 多语言：文字在 src/messages/<语言>/terms.json，英文那份一字不许改（谷歌、苹果、收款方看的就是它）。
// 不是英文的页面在「Last updated」下面多一行小字：这是翻译，跟英文有出入以英文为准。
const BRAND = "EasyGoSpa";
const APP_NAME = "EasyGoSpa — Home Massage";
const COMPANY = "EASYGOSPA HOME MASSAGE SERVICES OPC";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "terms" });
  return {
    title: t("title"),
    description: t("metaDescription", { brand: BRAND }),
    alternates: alternatesFor(locale, "/terms-of-service"),
  };
}

export default async function TermsOfServicePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "terms" });
  const b = (chunks) => <strong>{chunks}</strong>;

  return (
    // 2026-11-10 换成建站模版 serinity 的内页样子：顶上深色条垫菜单，正文放一张白卡片
    <main className="pt-32 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen relative">
      <span data-nav-over-dark hidden />
      <div style={{ backgroundImage: "url(/global/photos/band-living.webp)" }} className="w-full h-80 bg-center bg-cover -mt-[280px] mb-10" aria-hidden="true">
        <div className="w-full h-full bg-black/70" />
      </div>
      <div className="max-w-4xl mx-auto px-4 md:px-6"><div className="bg-white rounded-3xl shadow-lg px-6 py-10 md:p-14">
        <h1 className="font-serif text-[clamp(2rem,4.5vw,3.25rem)] text-[#0F0F0F] leading-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("lastUpdated", { date: t("updatedDate") })}</p>
        {locale !== "en" ? <p className="mt-1 text-xs text-gray-500">{t("languageNotice")}</p> : null}

        <div className="mt-8 space-y-6 text-[15px] leading-7 text-gray-700">
          <p>{t("intro", { brand: BRAND })}</p>
          {/* 2026-11-05 谷歌交易商声明的条款链接指向这一页，要写明适用于 App */}
          <p>{t("appliesToApp", { appName: APP_NAME })}</p>

          <Section title={t("services.title")}>
            <p>{t("services.body", { brand: BRAND })}</p>
          </Section>

          <Section title={t("booking.title")}>
            <p>{t("booking.body")}</p>
          </Section>

          <Section title={t("pricing.title")}>
            {/* 2026-11-05 老板定:「不是不收费 是5公里内50 10公里100。15公里150」,推翻 10-26 的不收车费。
                网页下单系统暂时还没加这笔钱,所以写 may apply、以下单前显示的总价为准;夜间费是 App 现有规矩 */}
            <p>{t("pricing.body")}</p>
          </Section>

          {/* 2026-10-26 老板定:退款规则照 App(窗口 3 方案 2.4,照 Grab 菲律宾):出发前全退、出发后收 ₱50/100/150 取消费全给技师、
              放鸽子同价一单一次、技师的错不收、现金客人加到下一单、原路退 / 退不了进余额、48 小时申诉。App 改规矩这里要跟着改。 */}
          <Section id="refunds" title={t("refunds.title")}>
            <p>{t("refunds.intro")}</p>
            <ul className="mt-3 list-disc pl-5 space-y-2">
              <li>{t.rich("refunds.beforeSetOff", { b })}</li>
              <li>{t.rich("refunds.afterSetOff", { b })}</li>
              <li>{t.rich("refunds.noShow", { b })}</li>
              <li>{t.rich("refunds.therapistFault", { b })}</li>
              <li>{t.rich("refunds.cash", { b })}</li>
              <li>{t.rich("refunds.howPaid", { b, brand: BRAND })}</li>
              <li>{t.rich("refunds.mistake", { b })}</li>
            </ul>
            <p className="mt-3">{t("refunds.outro")}</p>
          </Section>

          <Section title={t("conduct.title")}>
            <p>{t("conduct.body", { brand: BRAND })}</p>
          </Section>

          <Section title={t("health.title")}>
            <p>{t("health.body")}</p>
          </Section>

          <Section title={t("availability.title")}>
            <p>{t("availability.body")}</p>
          </Section>

          <Section title={t("liability.title")}>
            <p>{t("liability.body", { brand: BRAND })}</p>
          </Section>

          <Section title={t("changes.title")}>
            <p>{t("changes.body")}</p>
          </Section>

          <Section title={t("law.title")}>
            <p>{t("law.body")}</p>
          </Section>

          <Section title={t("contact.title")}>
            <p>{t("contact.intro")}</p>
            <p className="font-medium text-[#171A17]">{BRAND}</p>
            <p>{t.rich("contact.email", { email: CONTACT_EMAIL, link: (chunks) => <a className="text-[#64734F]" href={`mailto:${CONTACT_EMAIL}`}>{chunks}</a> })}</p>
            <p>{t("contact.phone", { phone: COMPANY_PHONE })}</p>
          </Section>

          {/* 2026-10-26 老板定:所有条款结尾加「解释权归公司」,写法跟 App 服务条款一致 */}
          <p className="pt-4 border-t border-gray-200 text-gray-600">{t("finalInterpretation", { company: COMPANY })}</p>
        </div>
      </div></div>
    </main>
  );
}

function Section({ id, title, children }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="font-serif text-2xl text-[#0F0F0F] mb-1">{title}</h2>
      {children}
    </section>
  );
}
