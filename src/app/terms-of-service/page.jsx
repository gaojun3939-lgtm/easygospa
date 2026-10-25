import { CONTACT_EMAIL, COMPANY_PHONE } from "@/lib/contactConfig";

export const metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of EasyGoSpa home massage booking services in Metro Manila.",
};

const LAST_UPDATED = "October 26, 2026";

export default function TermsOfServicePage() {
  return (
    <main className="pt-28 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-serif text-4xl font-bold text-[#0F0F0F]">Terms of Service</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-6 text-[15px] leading-7 text-gray-700">
          <p>Welcome to EasyGoSpa. By booking or using our website and services, you agree to these Terms of Service. Please read them carefully. If you do not agree, please do not use our services.</p>

          <Section title="1. Our services">
            <p>EasyGoSpa arranges professional home massage services delivered by trained therapists to your hotel, condo, home, or office within Metro Manila, Philippines. Service availability depends on therapist schedules, your location, and the time of booking.</p>
          </Section>

          <Section title="2. Booking and confirmation">
            <p>A booking request is not guaranteed until we confirm it and assign a therapist. We will contact you to confirm the therapist and schedule. Estimated arrival times shown on the site are indicative and may change based on traffic and therapist availability.</p>
          </Section>

          <Section title="3. Pricing and payment">
            {/* 2026-10-26 老板定:跟网站对齐——不收车费(原来写「车费会提前告知」,跟首页 ₱0 Transport Fee 对不上) */}
            <p>Service prices are shown before you confirm a booking. There is no transport fee and no tip is expected. Payment is made in cash to the therapist when they arrive, before the service begins.</p>
          </Section>

          {/* 2026-10-26 老板定:退款规则照 App(窗口 3 方案 2.4,照 Grab 菲律宾):出发前全退、出发后收 ₱50/100/150 取消费全给技师、
              放鸽子同价一单一次、技师的错不收、现金客人加到下一单、原路退 / 退不了进余额、48 小时申诉。App 改规矩这里要跟着改。 */}
          <Section title="4. Cancellations and refunds">
            <p>If you need to cancel or reschedule, please tell us as early as possible so we can free up the therapist.</p>
            <ul className="mt-3 list-disc pl-5 space-y-2">
              <li><strong>Before your therapist sets off:</strong> you can cancel free of charge. If you paid online, you get a full refund.</li>
              <li><strong>After your therapist has set off:</strong> a cancellation fee of ₱50, ₱100 or ₱150 applies, depending on the distance. The fee goes to the therapist. If you paid online, the rest is refunded.</li>
              <li><strong>No-show:</strong> if your therapist arrives and you are not there after 10 minutes, the same cancellation fee applies, once per booking.</li>
              <li><strong>No fee when it is the therapist&apos;s fault</strong>, for example arriving more than 15 minutes later than estimated, not heading to you, or marking arrival without being there.</li>
              <li><strong>Cash bookings:</strong> if you pay in cash, a cancellation fee is added to your next booking.</li>
              <li><strong>How refunds are paid:</strong> back to the original payment method where possible (GCash or Maya, usually within 1–3 days). Payments that cannot be reversed, such as QR Ph, are refunded to your EasyGoSpa balance, which you can use on your next booking or withdraw.</li>
              <li><strong>Charged by mistake?</strong> Contact us within 48 hours and we will review it.</li>
            </ul>
            <p className="mt-3">Repeated late cancellations or no-shows may affect future bookings. If a therapist is unable to attend, we will notify you and help arrange an alternative.</p>
          </Section>

          <Section title="5. Professional service and conduct">
            <p>EasyGoSpa provides strictly professional, non-sexual therapeutic massage. Any request for sexual services, harassment, or abusive behaviour toward a therapist is strictly prohibited and will result in immediate cancellation without refund and possible refusal of future service. Our therapists may end a session if they feel unsafe or disrespected.</p>
          </Section>

          <Section title="6. Health and safety">
            <p>Please inform us of any medical conditions, injuries, allergies, or pregnancy before your session so the therapist can adjust the treatment. Massage is not a substitute for medical care. You are responsible for providing accurate information and a safe, clean space for the service.</p>
          </Section>

          <Section title="7. Therapist availability">
            <p>Therapists are independent service providers scheduled through our platform. Specific therapists cannot always be guaranteed; if your chosen therapist becomes unavailable, we will offer a suitable alternative or reschedule.</p>
          </Section>

          <Section title="8. Limitation of liability">
            <p>To the extent permitted by law, EasyGoSpa is not liable for indirect or incidental damages arising from the use of our services. Our total liability for any claim is limited to the amount paid for the specific booking concerned.</p>
          </Section>

          <Section title="9. Changes to these terms">
            <p>We may update these Terms of Service from time to time. The latest version will always be posted on this page with a new “Last updated” date. Continued use of our services means you accept the updated terms.</p>
          </Section>

          <Section title="10. Governing law">
            <p>These terms are governed by the laws of the Republic of the Philippines. Any dispute will be handled in the appropriate courts of Metro Manila.</p>
          </Section>

          <Section title="11. Contact us">
            <p>For questions about these terms, contact us at:</p>
            <p className="font-medium text-[#0F0F0F]">EasyGoSpa</p>
            <p>Email: <a className="text-[#2db83d]" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
            <p>Phone / WhatsApp: {COMPANY_PHONE}</p>
          </Section>

          {/* 2026-10-26 老板定:所有条款结尾加「解释权归公司」,写法跟 App 服务条款一致 */}
          <p className="pt-4 border-t border-gray-200 text-gray-600">EASYGOSPA HOME MASSAGE SERVICES OPC reserves the right of final interpretation of these Terms.</p>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="font-serif text-xl font-bold text-[#0F0F0F] mt-8 mb-2">{title}</h2>
      {children}
    </section>
  );
}
