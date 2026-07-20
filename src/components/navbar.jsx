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

export default function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isBookingOpen, setIsBookingOpen] = React.useState(false);
  const [initialService, setInitialService] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);

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
      { name: "Contact", url: "/contact" },
    ],
    []
  );


  return (
    <div>
         <nav
        className={`fixed font-extrabold top-0 left-0 right-0 z-50 nav-transition ${
          isScrolled || isMenuOpen ? "glass-nav border-b-1 border-[#2db83d1a] backdrop-blur-lg bg-[#f8f2ecf2] py-4" : "bg-transparent py-6"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between pt-4">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 group transform transition-transform hover:scale-105"
              aria-label="EasyGo Spa - Home Massage Service"
            >
              <div className="relative">
                <BrandMark size={34} tone={isScrolled || isMenuOpen ? 'brand' : 'light'} />
              </div>
              <div>
                <h1
                  className={`text-[#2db83d] text-lg font-bold font-serif text-center glow-text`}
                >
                  EasyGo Spa
                </h1>
                <p
                  className={`text-xs text-center tracking-widest ${
                    isScrolled || isMenuOpen
                      ? "text-[#2db83d]"
                      : "text-[#2db83d] text-shadow-dark"
                  }`}
                >
                  Premium Home Massage
                </p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8" role="menubar">
              {currentNavItems.map((item) => {
                const active = pathname === item.url;
                return (
                  <Link
                    key={item.name}
                    href={item.url}
                    role="menuitem"
                    className={`text-lg font-medium transition-all duration-300 hover:text-[#2db83d] relative group ${
                      active
                        ? "text-[#2db83d]"
                        : isScrolled || isMenuOpen
                        ? "text-[#0F0F0F]"
                        : "text-white text-shadow-dark"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.name}
                    <span
                      className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2db83d] transition-all duration-300 group-hover:w-full"
                      aria-hidden="true"
                    />
                  </Link>
                );
              })}
            </div>

            {/* CTA */}
            <div className="hidden lg:flex items-center gap-5">
              <button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open-my-orders"))
                }
                className={`text-lg font-medium transition-colors duration-300 hover:text-[#2db83d] ${
                  isScrolled || isMenuOpen ? "text-[#0F0F0F]" : "text-white text-shadow-dark"
                }`}
                aria-label="Open my orders"
              >
                My orders
              </button>
              <button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent("open-booking-modal"))
                }
                className="bg-[#2db83d] text-white px-6 py-3 rounded-full text-sm font-medium hover:bg-[#0F0F0F] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2"
                aria-label="Open booking appointment modal"
              >
                Book Now
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`lg:hidden p-2 z-50 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 rounded ${
                isScrolled || isMenuOpen
                  ? "text-[#0F0F0F]"
                  : "text-white text-shadow-dark"
              }`}
              onClick={() => setIsMenuOpen((s) => !s)}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="fixed inset-0 bg-[#F8F2EC]/95 backdrop-blur-lg z-40 flex flex-col items-center justify-center lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div className="flex flex-col items-center gap-8">
            {currentNavItems.map((item) => {
              const active = pathname === item.url;
              return (
                <Link
                  key={item.name}
                  href={item.url}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-2xl font-medium transition-all duration-300 hover:text-[#2db83d] focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 rounded px-2 py-1 ${
                    active ? "text-[#2db83d]" : "text-[#0F0F0F]"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                window.dispatchEvent(new CustomEvent("open-my-orders"));
              }}
              className="text-2xl font-medium text-[#0F0F0F] transition-all duration-300 hover:text-[#2db83d] focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 rounded px-2 py-1"
              aria-label="Open my orders"
            >
              My orders
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                window.dispatchEvent(new CustomEvent("open-booking-modal"));
              }}
              className="mt-8 bg-[#2db83d] text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-[#0F0F0F] transition-all duration-300 hover:scale-105 shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 cursor-pointer"
              aria-label="Open booking appointment modal"
            >
              Book Appointment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
