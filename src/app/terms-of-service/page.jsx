import { CONTACT_EMAIL, COMPANY_PHONE } from "@/lib/contactConfig";

export const metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of EasyGoSpa home massage booking services in Metro Manila.",
};

const LAST_UPDATED = "July 19, 2026";

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
            <p>A booking request is not guaranteed until we confirm it and assign a therapist. We will contact you to confirm the therapist, schedule, and any travel fee. Estimated arrival times shown on the site are indicative and may change based on traffic and therapist availability.</p>
          </Section>

          <Section title="3. Pricing and payment">
            <p>Service prices are shown before you confirm a booking. Unless otherwise arranged, payment is made in cash to the therapist before the service begins, as indicated during booking. Any applicable travel fee will be communicated in advance.</p>
          </Section>

          <Section title="4. Cancellation and no-show">
            <p>If you need to cancel or reschedule, please tell us as early as possible so we can free up the therapist. Repeated late cancellations or no-shows may affect future bookings. If a therapist is unable to attend, we will notify you and help arrange an alternative.</p>
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
