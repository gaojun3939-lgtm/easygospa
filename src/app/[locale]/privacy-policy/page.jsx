import { getTranslations, setRequestLocale } from "next-intl/server";
import { CONTACT_EMAIL, COMPANY_PHONE } from "@/lib/contactConfig";
import { alternatesFor } from "@/i18n/routing";

// 2026-10-19：跟 App 里「条款与政策 › 隐私政策」对齐（D:\APP\src\content\helpArticles.ts，英文为准）。
// 2026-10-27：老板逐句批了 App 隐私政策的补充（10-18 以后新功能：提现账户、推荐有奖、紧急联系人、客服对话、信用分、钱包），
// 主窗口转来 App 定稿英文（App src/shared/i18n/en.ts 的 help.privacy.*），这里 11 处整句照换 / 新加，其余句子不动。
// Google Play 后台填的隐私政策网址就是这一页，审核员看的是它：App 的数据、技师路上的位置分享、第三方服务商、删号都要写全。
// 官网自己多两样：Meta 像素（广告统计）、网站 Cookie。
// 2026-11-09 多语言：文字在 src/messages/<语言>/privacy.json，英文那份一字不许改。
// 不是英文的页面在「Last updated」下面多一行小字：这是翻译，跟英文有出入以英文为准。
const BRAND = "EasyGoSpa";
const COMPANY = "EASYGOSPA HOME MASSAGE SERVICES OPC";
const DELETE_URL = "https://app-easygospa.vercel.app/delete-account";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("title"),
    description: t("metaDescription", { brand: BRAND }),
    alternates: alternatesFor(locale, "/privacy-policy"),
  };
}

export default async function PrivacyPolicyPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "privacy" });

  return (
    <main className="ga-legal">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="ga-legal-title">{t("title")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("lastUpdated", { date: t("updatedDate") })}</p>
        {locale !== "en" ? <p className="mt-1 text-xs text-gray-500">{t("languageNotice")}</p> : null}

        <div className="prose prose-gray mt-8 space-y-6 text-[15px] leading-7 text-gray-700">
          <p>{t("intro", { company: COMPANY, brand: BRAND })}</p>

          <Section title={t("collect.title")}>
            <p>{t("collect.everyoneIntro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("collect.everyone.account")}</li>
              <li>{t("collect.everyone.profile")}</li>
              <li>{t("collect.everyone.addresses")}</li>
              <li>{t("collect.everyone.bookings")}</li>
              <li>{t("collect.everyone.messages")}</li>
              <li>{t("collect.everyone.device")}</li>
              <li>{t("collect.everyone.usage")}</li>
              <li>{t("collect.everyone.referrals")}</li>
              <li>{t("collect.everyone.payout")}</li>
              {/* 2026-11-07 安卓 0.7.137 换手机恢复登录(谷歌 Restore Credentials),跟 App 隐私政策一字不差,英文为准 */}
              <li>{t("collect.everyone.restoreSignIn")}</li>
            </ul>
            <p>{t("collect.therapistsIntro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("collect.therapists.serviceProfile")}</li>
              <li>{t("collect.therapists.identity")}</li>
              <li>{t("collect.therapists.jobRecords")}</li>
              <li>{t("collect.therapists.liveLocation")}</li>
              <li>{t("collect.therapists.safety", { brand: BRAND })}</li>
            </ul>
          </Section>

          <Section title={t("use.title")}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("use.provide")}</li>
              <li>{t("use.safety")}</li>
              <li>{t("use.communicate")}</li>
              <li>{t("use.payments")}</li>
              <li>{t("use.support")}</li>
              <li>{t("use.improve")}</li>
            </ul>
          </Section>

          <Section title={t("access.title")}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("access.customers")}</li>
              <li>{t("access.therapists")}</li>
              <li>{t("access.staff", { brand: BRAND })}</li>
              <li>{t("access.chats", { brand: BRAND })}</li>
              <li>{t("access.law")}</li>
              <li>{t("access.noSale")}</li>
            </ul>
          </Section>

          <Section title={t("providers.title")}>
            <p>{t("providers.intro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("providers.supabase")}</li>
              <li>{t("providers.google")}</li>
              <li>{t("providers.semaphore")}</li>
              <li>{t("providers.push")}</li>
              <li>{t("providers.analytics")}</li>
              <li>{t("providers.crashlytics")}</li>
              <li>{t("providers.appsflyer")}</li>
              <li>{t("providers.meta")}</li>
              <li>{t("providers.xendit")}</li>
            </ul>
          </Section>

          <Section title={t("storage.title")}>
            <p>{t("storage.body")}</p>
          </Section>

          <Section title={t("retention.title")}>
            <p>{t("retention.account")}</p>
            <p>{t("retention.chats")}</p>
            <p>{t("retention.fingerprint")}</p>
          </Section>

          <Section title={t("protect.title")}>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("protect.encrypted")}</li>
              <li>{t("protect.limited")}</li>
              <li>{t("protect.idPhotos")}</li>
            </ul>
            <p>{t("protect.outro")}</p>
          </Section>

          <Section title={t("location.title")}>
            <p>{t("location.body")}</p>
          </Section>

          <Section title={t("cookies.title")}>
            <p>{t("cookies.body")}</p>
          </Section>

          <Section title={t("rights.title")}>
            <p>{t("rights.intro")}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{t("rights.informed")}</li>
              <li>{t("rights.access")}</li>
              <li>{t("rights.correct")}</li>
              <li>{t("rights.delete")}</li>
              <li>{t("rights.object")}</li>
              <li>{t("rights.copy")}</li>
              <li>{t("rights.complaint")}</li>
            </ul>
            <p>{t("rights.outro")}</p>
          </Section>

          <Section title={t("deletion.title")}>
            <p>{t.rich("deletion.body", { brand: BRAND, url: DELETE_URL, link: (chunks) => <a className="text-[#64734F]" href={DELETE_URL}>{chunks}</a> })}</p>
          </Section>

          <Section title={t("minors.title")}>
            <p>{t("minors.body")}</p>
          </Section>

          <Section title={t("changes.title")}>
            <p>{t("changes.body")}</p>
          </Section>

          <Section title={t("contact.title")}>
            <p>{t("contact.intro")}</p>
            <p className="font-medium text-[#171A17]">{COMPANY}</p>
            <p>{t.rich("contact.email", { email: CONTACT_EMAIL, link: (chunks) => <a className="text-[#64734F]" href={`mailto:${CONTACT_EMAIL}`}>{chunks}</a> })}</p>
            <p>{t("contact.phone", { phone: COMPANY_PHONE })}</p>
          </Section>

          {/* 2026-10-26 老板定:所有条款结尾加「解释权归公司」,写法跟 App 隐私政策一致 */}
          <p className="pt-4 border-t border-gray-200 text-gray-600">{t("finalInterpretation", { company: COMPANY })}</p>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="ga-legal-h2">{title}</h2>
      {children}
    </section>
  );
}
