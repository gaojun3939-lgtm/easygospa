"use client"
import { Check, Globe, MapPin, X, Menu } from "lucide-react";
import React from 'react'
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LANGUAGES } from "@/i18n/routing";
import BrandMark from "@/components/BrandMark";

// 顶上菜单（2026-11-10 换回建站模版 serinity 的样子：压在大图上是透明白字，往下滑变成米色毛玻璃）。
// 比模版多三样：语言（七种，跟 App 一样）、我的订单、下载 App。
// 页面顶上有深色大图的（首页、各内页的头图），放一个 [data-nav-over-dark] 标记，菜单在最上面时才透明；别的页面一直是实底。

// 全球站预留的 6 个地方（老板 2026-11-03 战略规划）。现在只开了菲律宾，他定先不显示其它地方，开第二个国家时改成 true
const SHOW_REGION_MENU = false;
const REGIONS = [
  { name: "Philippines", live: true },
  { name: "Taiwan" },
  { name: "Vietnam" },
  { name: "Malaysia" },
  { name: "Thailand" },
  { name: "Singapore" },
];

const NAV_ITEMS = [
  { key: "home", url: "/" },
  { key: "services", url: "/services" },
  // 2026-10-26 老板定:价目表页挂进菜单,Xendit 审核员和客人一进站就找得到价格
  { key: "pricing", url: "/pricing" },
  { key: "gallery", url: "/gallery" },
  { key: "team", url: "/team" },
  { key: "contact", url: "/contact" },
];
// 2026-11-10 老板「为什么官网没有 app 下载的介绍」→ 11-11 老板「官网顶部显示的就说 app」：
// 右上角的主按钮从「预约」换成「下载 App」，指到首页下载横幅；菜单里原来那个「下载 App」就不重复放了。
const APP_URL = "/#app";

const openBooking = () => window.dispatchEvent(new CustomEvent("open-booking-modal"));
const openOrders = () => window.dispatchEvent(new CustomEvent("open-my-orders"));

export default function Navbar() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [overDark, setOverDark] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLangOpen, setIsLangOpen] = React.useState(false);

  // usePathname 来自多语言那一层：给的是不带语言前缀的网址（/ja/services 给 /services）
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("nav");
  const query = searchParams.toString();
  const here = query ? `${pathname}?${query}` : pathname;
  const current = LANGUAGES.find((lang) => lang.code === locale) || LANGUAGES[0];

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    const closeLang = (event) => { if (!event.target.closest?.("[data-lang-menu]")) setIsLangOpen(false); };
    document.addEventListener("click", closeLang);
    // 预热期(React 未接管前)点过「预约」的,等下单窗口挂好再补开一次
    if (window.__egOpenBooking) {
      window.__egOpenBooking = false;
      setTimeout(openBooking, 0);
    }
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", closeLang);
    };
  }, []);

  // 换页后重新看这一页顶上是不是深色大图
  React.useEffect(() => {
    setOverDark(Boolean(document.querySelector("[data-nav-over-dark]")));
    setIsMenuOpen(false);
  }, [pathname]);

  const solid = isScrolled || isMenuOpen || !overDark;
  const isActive = (url) => pathname === url;
  const linkColor = (url) => (isActive(url) ? (solid ? "text-[#55633F]" : "text-[#DDE6CC]") : solid ? "text-[#0F0F0F]" : "text-white text-shadow-dark");

  const languageMenu = (inSheet = false) => (
    <div className="relative" data-lang-menu>
      <button
        type="button"
        onClick={() => setIsLangOpen((open) => !open)}
        aria-expanded={isLangOpen}
        aria-label={t("language")}
        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors duration-300 ${inSheet || solid ? "text-[#0F0F0F] hover:bg-[#64734F]/10" : "text-white text-shadow-dark hover:bg-white/10"}`}
      >
        <Globe className="w-4 h-4" aria-hidden="true" />
        <span>{inSheet ? current.label : current.short}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {isLangOpen ? (
        <div className={`absolute ${inSheet ? "left-1/2 -translate-x-1/2" : "right-0"} top-full mt-2 w-60 rounded-2xl bg-white shadow-2xl border border-black/5 p-2 z-[70] text-left`}>
          {SHOW_REGION_MENU ? (
            <>
              <p className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-widest text-gray-400">{t("region")}</p>
              {REGIONS.map((region) => (
                <div key={region.name} className={`flex justify-between px-3 py-2 text-sm ${region.live ? "text-[#0F0F0F]" : "text-gray-400"}`}>
                  <span>{t(`regions.${region.name}`)}</span>
                  <span>{region.live ? t("nowServing") : t("comingSoon")}</span>
                </div>
              ))}
            </>
          ) : (
            <p className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500"><MapPin className="w-4 h-4 text-[#64734F]" aria-hidden="true" />{t("philippines")}</p>
          )}
          <p className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-widest text-gray-400">{t("language")}</p>
          {LANGUAGES.map((lang) => (
            <Link
              key={lang.code}
              href={here}
              locale={lang.code}
              hrefLang={lang.hreflang}
              lang={lang.hreflang}
              aria-current={lang.code === locale ? "true" : undefined}
              onClick={() => setIsLangOpen(false)}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-[15px] ${lang.code === locale ? "bg-[#64734F]/10 text-[#55633F] font-medium" : "text-[#0F0F0F] hover:bg-[#F8F2EC]"}`}
            >
              <span>{lang.label}</span>
              {lang.code === locale ? <Check className="w-4 h-4" aria-hidden="true" /> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );

  return (
    <div>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 nav-transition ${solid ? "glass-nav py-3" : "bg-transparent py-5"}`}
        role="navigation"
        aria-label={t("mainAria")}
      >
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 group transition-transform hover:scale-105 flex-shrink-0" aria-label={t("homeAria")}>
              <BrandMark size={36} tone={solid ? "brand" : "light"} />
              <div className="leading-tight">
                <p className={`font-serif text-lg ${solid ? "text-[#0F0F0F]" : "text-white text-shadow-dark"}`}>EasyGo Spa</p>
                <p className={`text-[11px] tracking-widest uppercase ${solid ? "text-[#64734F]" : "text-[#DDE6CC] text-shadow-dark"}`}>{t("tagline")}</p>
              </div>
            </Link>

            <div className="hidden xl:flex items-center gap-7" role="menubar">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.key}
                  href={item.url}
                  role="menuitem"
                  aria-current={isActive(item.url) ? "page" : undefined}
                  className={`text-[15px] font-medium transition-all duration-300 hover:text-[#64734F] relative group whitespace-nowrap ${linkColor(item.url)}`}
                >
                  {t(item.key)}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#64734F] transition-all duration-300 group-hover:w-full" aria-hidden="true" />
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="hidden sm:block">{languageMenu()}</div>
              <button type="button" onClick={openOrders} aria-label={t("openOrders")} className={`hidden md:block rounded-full px-3 py-2 text-sm font-medium transition-colors duration-300 whitespace-nowrap ${solid ? "text-[#0F0F0F] hover:bg-[#64734F]/10" : "text-white text-shadow-dark hover:bg-white/10"}`}>
                {t("myOrders")}
              </button>
              <Link
                href={APP_URL}
                className="bg-[#64734F] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm font-medium hover:bg-[#0F0F0F] transition-all duration-300 hover:scale-105 shadow-lg whitespace-nowrap"
              >
                {t("getApp")}
              </Link>
              <button
                type="button"
                className={`xl:hidden p-2 rounded ${solid ? "text-[#0F0F0F]" : "text-white text-shadow-dark"}`}
                onClick={() => setIsMenuOpen((open) => !open)}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div id="mobile-menu" className="fixed inset-0 bg-[#F8F2EC]/95 backdrop-blur-lg z-40 flex flex-col items-center justify-center xl:hidden overflow-y-auto py-24" role="dialog" aria-modal="true" aria-label={t("mobileAria")}>
          <div className="flex flex-col items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.url}
                onClick={() => setIsMenuOpen(false)}
                aria-current={isActive(item.url) ? "page" : undefined}
                className={`text-2xl font-medium transition-all duration-300 hover:text-[#64734F] rounded px-2 py-1 ${isActive(item.url) ? "text-[#55633F]" : "text-[#0F0F0F]"}`}
              >
                {t(item.key)}
              </Link>
            ))}
            <button type="button" onClick={() => { setIsMenuOpen(false); openOrders(); }} className="text-2xl font-medium text-[#0F0F0F] hover:text-[#64734F] px-2 py-1">
              {t("myOrders")}
            </button>
            <div className="pt-2">{languageMenu(true)}</div>
            <Link
              href={APP_URL}
              onClick={() => setIsMenuOpen(false)}
              className="mt-4 bg-[#64734F] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#0F0F0F] transition-all duration-300 hover:scale-105 shadow-lg"
            >
              {t("getApp")}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
