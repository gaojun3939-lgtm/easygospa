import { CONTACT_EMAIL, COMPANY_PHONE, FACEBOOK_URL, INSTAGRAM_URL, whatsappLink } from '@/lib/contactConfig'

// 全球站页脚：旧页脚每一样都在，只换样子。公司全名、注册号、地址、退款入口是收款审核要看的，不能少。
const WHATSAPP_TEXT = 'Hi EasyGoSpa, I would like to ask about a home massage booking.'
const TREATMENTS = ['Deep tissue', 'Hot Stone Massage', 'Relaxing Premium Aromatherapy Body Massage', 'Shiatsu Massage (without Oil)', 'Swedish Massage', 'Thai Body Massage']

export default function SiteFooter() {
  return (
    <footer className="ga-footer" role="contentinfo">
      <div className="ga-wrap">
        <div className="ga-foot-cols">
          <div className="ga-foot-brand">
            <b>EasyGoSpa</b>
            <p>Professional Home Massage. EasyGoSpa provides professional home massage services across Metro Manila.</p>
            <div className="ga-foot-social">
              <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer">Instagram</a>
              <a href={FACEBOOK_URL} target="_blank" rel="noreferrer">Facebook</a>
              <a href={whatsappLink(WHATSAPP_TEXT)} target="_blank" rel="noreferrer">WhatsApp</a>
            </div>
          </div>
          <div>
            <h2>Popular Treatments</h2>
            <ul>
              {TREATMENTS.map((name) => <li key={name}><a href="/pricing">{name}</a></li>)}
              <li><a href="/services">Home &amp; Hotel Massage</a></li>
            </ul>
          </div>
          <div>
            <h2>Contact EasyGoSpa</h2>
            <ul>
              <li><a href="https://www.easygospa.com/">Website: www.easygospa.com</a></li>
              <li>Service Area: Metro Manila</li>
              <li>Available in selected areas across Metro Manila</li>
              <li><a href={`tel:${COMPANY_PHONE.replace(/\s/g, '')}`}>Phone: {COMPANY_PHONE}</a></li>
              <li><a href={whatsappLink(WHATSAPP_TEXT)} target="_blank" rel="noreferrer">WhatsApp: {COMPANY_PHONE}</a></li>
              <li><a href={`mailto:${CONTACT_EMAIL}`}>Email: {CONTACT_EMAIL}</a></li>
            </ul>
          </div>
          <div>
            <h2>Special Offers</h2>
            <ul><li>Follow us on Facebook for promotions, discounts, and home massage service updates.</li></ul>
            <a className="ga-foot-follow" href={FACEBOOK_URL} target="_blank" rel="noreferrer">Follow us on Facebook</a>
          </div>
        </div>
        <p className="ga-foot-word" aria-hidden="true">EasyGoSpa</p>
        <div className="ga-foot-legal">
          <div>
            © 2026 EASYGOSPA HOME MASSAGE SERVICES OPC. All rights reserved.<br />
            SEC Reg. No. 2026060255013-01<br />
            Unit 706, Medical Towers Makati, 103 Rufino Street, Legazpi Village, Bel-Air, Makati City, Metro Manila 1209
          </div>
          <nav aria-label="Legal">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-of-service">Terms of Service</a>
            <a href="/terms-of-service#refunds">Refund Policy</a>
          </nav>
        </div>
      </div>
    </footer>
  )
}
