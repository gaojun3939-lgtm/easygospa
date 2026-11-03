'use client';

import React from "react";
import Link from "next/link";
import PageHead from "../../components/global/PageHead";

// 2026-10-26 老板定(重新申请 Xendit 前全站清模板残留):原来列着 Gallery / Our Team(假页面,已下线)
// 和美容、激光脱毛、美甲、美发、Japanese Head Spa(我们没有)。现在只列真页面和后台在售的 6 个按摩项目,
// 项目名照后台原样,点了去价目表;后台改名 / 加项目时这里要跟着改。
const sitePages = [
  {
    category: "Main Pages",
    pages: [
      { name: "Home", url: "/", description: "Professional home massage across Metro Manila" },
      { name: "Services", url: "/services", description: "All massage treatments with prices" },
      { name: "Pricing", url: "/pricing", description: "Prices for every treatment and duration" },
      { name: "Contact", url: "/contact", description: "Phone, WhatsApp, email and service area" },
      { name: "Terms of Service", url: "/terms-of-service", description: "Booking, payment, cancellation and refund rules" },
      { name: "Privacy Policy", url: "/privacy-policy", description: "How we handle your personal information" }
    ]
  },
  {
    category: "Massage Treatments",
    pages: [
      { name: "Deep tissue", url: "/pricing", description: "Firm, targeted pressure for chronic muscle tension" },
      { name: "Hot Stone Massage", url: "/pricing", description: "Warm stones and soothing massage to relax tight muscles" },
      { name: "Relaxing Premium Aromatherapy Body Massage", url: "/pricing", description: "Gentle massage with natural essential oils" },
      { name: "Shiatsu Massage(without Oil)", url: "/pricing", description: "Traditional Japanese finger and palm pressure, no oil" },
      { name: "Swedish Massage", url: "/pricing", description: "Gentle full-body massage with oil, great for beginners" },
      { name: "Thai Body Massage", url: "/pricing", description: "Oil-free deep pressure with full-body stretching" }
    ]
  }
];

export default function Sitemap() {
  return (
    <div className="ga ga-page">
      <PageHead eyebrow="Site Navigation" title="EasyGo Spa Website Sitemap">
        Find every page of the EasyGoSpa website in one place.
      </PageHead>

      {sitePages.map((section) => (
        <section className="ga-wrap ga-page-sec ga-sitemap" key={section.category}>
          <h2 className="ga-sec-title">{section.category}</h2>
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
        <h2 className="ga-sec-title">About Our Website</h2>
        <div className="ga-about">
          <div>
            <h3>Website Features</h3>
            <ul>
              <li>Responsive design for all devices</li>
              <li>Online booking — choose your own therapist</li>
              <li>Service menu with prices</li>
              <li>Order tracking</li>
              <li>Contact and service area information</li>
            </ul>
          </div>
          <div>
            <h3>Registered Office</h3>
            {/* 原来是建站模板的假地址(P-145, Sector A…1229),换成跟页脚一致的公司注册地址 */}
            <ul>
              <li>EASYGOSPA HOME MASSAGE SERVICES OPC</li>
              <li>Unit 706, Medical Towers Makati, 103 Rufino Street,</li>
              <li>Legazpi Village, Bel-Air, Makati City, Metro Manila 1209</li>
              <li>Home service only — our therapists come to you.</li>
              <li className="ga-page-note">Phone: +63 964 857 0967</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="ga-cta">
        <div className="ga-wrap">
          <h2>Ready to Experience EasyGo Spa?</h2>
          <p>Book your appointment today — choose your therapist and pay in cash when they arrive.</p>
          <button
            type="button"
            className="ga-btn ga-btn-big ga-btn-light"
            onClick={() => window.dispatchEvent(new CustomEvent('open-booking-modal'))}
          >
            Book Your Experience
          </button>
        </div>
      </section>
    </div>
  );
}
