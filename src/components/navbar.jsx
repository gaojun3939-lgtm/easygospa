"use client"
import { Check, Globe, MapPin, X, Menu } from "lucide-react";
import React from 'react'
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LANGUAGES } from "@/i18n/routing";

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

export default function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isRegionOpen, setIsRegionOpen] = React.useState(false);
  const [isNavHidden, setIsNavHidden] = React.useState(false);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [initialService, setInitialService] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const lastScrollY = React.useRef(0);
  // usePathname 来自多语言那一层：给的是不带语言前缀的网址（/ja/services 给 /services）
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("nav");
  const query = searchParams.toString();
  const here = query ? `${pathname}?${query}` : pathname;
  const current = LANGUAGES.find((lang) => lang.code === locale) || LANGUAGES[0];

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
      // 往下滑藏起来，往上滑出现
      const y = window.scrollY;
      if (Math.abs(y - lastScrollY.current) > 6) {
        setIsNavHidden(y > lastScrollY.current && y > 160);
        lastScrollY.current = y;
      }
    };
    const closeRegion = (event) => { if (!event.target.closest?.(".ga-region")) setIsRegionOpen(false); };
    document.addEventListener("click", closeRegion);

    // add listeners safely on client
    window.addEventListener("scroll", handleScroll, { passive: true });

    const openBookingModal = () => {
      setInitialService(null);
      setIsBookingOpen(true);
    };

    const openBookingModalWithService = (event) => {
      setInitialService(event.detail?.service ?? null);
      setIsBookingOpen(true);
    };

    window.addEventListener("open-booking-modal", openBookingModal);
    window.addEventListener(
      "open-booking-modal-with-service",
      openBookingModalWithService
    );

    // Initial check in case user reloads mid-scroll
    handleScroll();

    // 预热期(React 未接管前)点过 CTA 的,挂载后补开弹窗。
    if (window.__egOpenBooking) {
      window.__egOpenBooking = false;
      setInitialService(null);
      setIsBookingOpen(true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("click", closeRegion);
      window.removeEventListener("open-booking-modal", openBookingModal);
      window.removeEventListener(
        "open-booking-modal-with-service",
        openBookingModalWithService
      );
    };
  }, []);

  const handleLoadingComplete = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleCloseBookingModal = React.useCallback(() => {
    setIsBookingOpen(false);
    setInitialService(null);
  }, []);

  const currentNavItems = React.useMemo(
    () => [
      { key: "home", url: "/" },
      { key: "services", url: "/services" },
      // 2026-10-26 老板定:价目表页挂进菜单,Xendit 审核员和客人一进站就找得到价格
      { key: "pricing", url: "/pricing" },
      { key: "contact", url: "/contact" },
    ],
    []
  );

  // 语言菜单：同一页换语言，网址后面的参数（例如 ?book=）原样带上
  const languageMenu = (
    <div className={`ga-region${isRegionOpen ? " is-open" : ""}`}>
      <button type="button" className="ga-region-btn" aria-expanded={isRegionOpen} aria-label={t("language")} onClick={() => setIsRegionOpen((open) => !open)}>
        <Globe size={17} aria-hidden="true" />
        <span className="ga-region-long">{current.label}</span>
        <span className="ga-region-short">{current.short}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="ga-region-panel">
        {SHOW_REGION_MENU ? (
          <>
            <p className="ga-region-title">{t("region")}</p>
            {REGIONS.map((region) => (
              <div key={region.name} className={`ga-region-row${region.live ? " is-on" : ""}`}>
                <span>{t(`regions.${region.name}`)}</span>
                <span>{region.live ? t("nowServing") : t("comingSoon")}</span>
              </div>
            ))}
          </>
        ) : (
          <p className="ga-region-here"><MapPin size={15} aria-hidden="true" />{t("philippines")}</p>
        )}
        <p className="ga-region-title">{t("language")}</p>
        {LANGUAGES.map((lang) => (
          <Link
            key={lang.code}
            href={here}
            locale={lang.code}
            hrefLang={lang.hreflang}
            lang={lang.hreflang}
            className={`ga-lang-row${lang.code === locale ? " is-on" : ""}`}
            aria-current={lang.code === locale ? "true" : undefined}
            onClick={() => setIsRegionOpen(false)}
          >
            <span>{lang.label}</span>
            {lang.code === locale ? <Check size={16} aria-hidden="true" /> : null}
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <nav className={`ga-nav is-solid${isScrolled ? " is-scrolled" : ""}${isNavHidden && !isMenuOpen && !isRegionOpen ? " is-hidden" : ""}`} role="navigation" aria-label={t("mainAria")}>
        <div className="ga-nav-in">
          <Link href="/" className="ga-logo" aria-label={t("homeAria")}>
            <img src="/global/lotus-olive.png" alt="" />
            EasyGoSpa
          </Link>
          <div className="ga-nav-links" role="menubar">
            {currentNavItems.map((item) => (
              <Link key={item.key} href={item.url} role="menuitem" aria-current={pathname === item.url ? "page" : undefined}>
                {t(item.key)}
              </Link>
            ))}
          </div>
          <div className="ga-nav-right">
            {languageMenu}
            <button type="button" className="ga-orders" onClick={() => window.dispatchEvent(new CustomEvent("open-my-orders"))} aria-label={t("openOrders")}>
              {t("myOrders")}
            </button>
            <button type="button" className="ga-btn" onClick={() => window.dispatchEvent(new CustomEvent("open-booking-modal"))} aria-label={t("openBooking")}>
              {t("bookNow")}
            </button>
            <button type="button" className="ga-burger" onClick={() => setIsMenuOpen((open) => !open)} aria-expanded={isMenuOpen} aria-controls="mobile-menu" aria-label={isMenuOpen ? t("closeMenu") : t("openMenu")}>
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div id="mobile-menu" className="ga-sheet" role="dialog" aria-modal="true" aria-label={t("mobileAria")}>
          {currentNavItems.map((item) => (
            <Link key={item.key} href={item.url} onClick={() => setIsMenuOpen(false)} aria-current={pathname === item.url ? "page" : undefined}>
              {t(item.key)}
            </Link>
          ))}
          <button type="button" onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new CustomEvent("open-my-orders")); }} aria-label={t("openOrders")}>
            {t("myOrders")}
          </button>
          <button type="button" className="ga-btn" onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new CustomEvent("open-booking-modal")); }} aria-label={t("openBooking")}>
            {t("bookAppointment")}
          </button>
        </div>
      )}
    </div>
  )
}
