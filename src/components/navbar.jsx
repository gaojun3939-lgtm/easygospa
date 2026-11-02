"use client"
import BrandMark from "./BrandMark";
import {
    Phone,
    Mail,
    Instagram,
    Facebook,
    MapPin,
    X,
    Menu,
  } from "lucide-react";
import React from 'react'
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

// 全球站预留的 6 个地方（老板 2026-11-03 战略规划），现在只有菲律宾在服务
const REGIONS = [
  { name: "Philippines", live: true },
  { name: "Taiwan" },
  { name: "Vietnam" },
  { name: "Malaysia" },
  { name: "Thailand" },
  { name: "Singapore" },
];

const LIGHT_TOP_PAGES = new Set(["/pricing", "/terms-of-service", "/privacy-policy", "/sitemap"]);

export default function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isRegionOpen, setIsRegionOpen] = React.useState(false);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [initialService, setInitialService] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  // 菜单「实底」样式(米色玻璃底 + 深色字 + 彩色莲花):往下滚、打开手机菜单时用;
  // 这几页顶上没有深色大图,透明底白字压在米色上看不见,所以一直用实底
  // (老板 2026-10-26:先点头 /pricing,后又定条款、隐私、目录页照做)。新加浅色顶的页面记得加进来。
  const solidNav = isScrolled || isMenuOpen || LIGHT_TOP_PAGES.has(pathname) || pathname?.startsWith("/r/");

  React.useEffect(() => {
    // 首页第一幕是整屏夜景，滑过之后菜单才变实底
    const handleScroll = () => {
      const hero = document.querySelector(".ga-hero");
      setIsScrolled(window.scrollY > (hero ? hero.offsetHeight - window.innerHeight - 40 : 80));
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
      { name: "Home", url: "/" },
      { name: "Services", url:"/services" },
      // 2026-10-26 老板定:价目表页挂进菜单,Xendit 审核员和客人一进站就找得到价格
      { name: "Pricing", url: "/pricing" },
      { name: "Contact", url: "/contact" },
    ],
    []
  );


  return (
    <div>
      <nav className={`ga-nav${solidNav ? " is-solid" : ""}`} role="navigation" aria-label="Main navigation">
        <div className="ga-nav-in">
          <Link href="/" className="ga-logo" aria-label="EasyGoSpa - Home Massage Service">
            <img src={solidNav ? "/global/lotus-olive.png" : "/global/lotus-white.png"} alt="" />
            EasyGoSpa
          </Link>
          <div className="ga-nav-links" role="menubar">
            {currentNavItems.map((item) => (
              <Link key={item.name} href={item.url} role="menuitem" aria-current={pathname === item.url ? "page" : undefined}>
                {item.name}
              </Link>
            ))}
          </div>
          <div className="ga-nav-right">
            <div className={`ga-region${isRegionOpen ? " is-open" : ""}`}>
              <button type="button" className="ga-region-btn" aria-expanded={isRegionOpen} onClick={() => setIsRegionOpen((open) => !open)}>
                <span className="ga-region-long">Philippines · English</span>
                <span className="ga-region-short">PH · EN</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <div className="ga-region-panel">
                {REGIONS.map((region) => (
                  <div key={region.name} className={`ga-region-row${region.live ? " is-on" : ""}`}>
                    <span>{region.name}</span>
                    <span>{region.live ? "Now serving" : "Coming soon"}</span>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" className="ga-orders" onClick={() => window.dispatchEvent(new CustomEvent("open-my-orders"))} aria-label="Open my orders">
              My orders
            </button>
            <button type="button" className="ga-btn" onClick={() => window.dispatchEvent(new CustomEvent("open-booking-modal"))} aria-label="Open booking appointment modal">
              Book Now
            </button>
            <button type="button" className="ga-burger" onClick={() => setIsMenuOpen((open) => !open)} aria-expanded={isMenuOpen} aria-controls="mobile-menu" aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
              {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div id="mobile-menu" className="ga-sheet" role="dialog" aria-modal="true" aria-label="Mobile navigation menu">
          {currentNavItems.map((item) => (
            <Link key={item.name} href={item.url} onClick={() => setIsMenuOpen(false)} aria-current={pathname === item.url ? "page" : undefined}>
              {item.name}
            </Link>
          ))}
          <button type="button" onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new CustomEvent("open-my-orders")); }} aria-label="Open my orders">
            My orders
          </button>
          <button type="button" className="ga-btn" onClick={() => { setIsMenuOpen(false); window.dispatchEvent(new CustomEvent("open-booking-modal")); }} aria-label="Open booking appointment modal">
            Book Appointment
          </button>
        </div>
      )}
    </div>
  )
}
