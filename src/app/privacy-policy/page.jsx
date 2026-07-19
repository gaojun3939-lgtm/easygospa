import { CONTACT_EMAIL, COMPANY_PHONE } from "@/lib/contactConfig";

export const metadata = {
  title: "Privacy Policy",
  description: "How EasyGoSpa collects, uses, and protects your personal information for home massage bookings in Metro Manila.",
};

const LAST_UPDATED = "July 19, 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="pt-28 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-serif text-4xl font-bold text-[#0F0F0F]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-gray mt-8 space-y-6 text-[15px] leading-7 text-gray-700">
          <p>EasyGoSpa (“we”, “us”, “our”) provides professional home massage booking services across Metro Manila, Philippines. This Privacy Policy explains what information we collect, how we use it, and the choices you have. We handle personal data in line with the Philippine Data Privacy Act of 2012 (RA 10173).</p>

          <Section title="1. Information we collect">
            <p>When you book or contact us, we may collect:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Your name, phone number, and email address;</li>
              <li>The service address (hotel, condo, home, or office) and, if you allow it, your location to estimate distance and availability;</li>
              <li>Booking details such as the service, date, time, and any notes you provide;</li>
              <li>Messages you send us through the website, WhatsApp, or other channels.</li>
            </ul>
          </Section>

          <Section title="2. How we use your information">
            <ul className="list-disc pl-5 space-y-1">
              <li>To confirm and arrange your booking and dispatch a therapist;</li>
              <li>To contact you about your booking, availability, and service updates;</li>
              <li>To provide customer support and respond to your enquiries;</li>
              <li>To improve our services and keep our platform safe and reliable.</li>
            </ul>
          </Section>

          <Section title="3. Sharing your information">
            <p>We share only the details needed to deliver your booking (such as your name, address, and contact number) with the therapist assigned to your appointment. We do not sell your personal information. We may disclose information if required by law or to protect the safety of our customers and staff.</p>
          </Section>

          <Section title="4. Communication">
            <p>By contacting us or booking, you agree that we may reach you by phone, SMS, or WhatsApp regarding your appointment. You can ask us to stop promotional messages at any time.</p>
          </Section>

          <Section title="5. Data retention">
            <p>We keep booking and contact records only as long as necessary for our services, legitimate business needs, and legal requirements, after which they are deleted or anonymised.</p>
          </Section>

          <Section title="6. Security">
            <p>We take reasonable technical and organisational measures to protect your information against loss, misuse, and unauthorised access. No method of transmission or storage is completely secure, but we work to safeguard your data.</p>
          </Section>

          <Section title="7. Your rights">
            <p>Under the Data Privacy Act, you may request access to, correction of, or deletion of your personal data, and you may object to certain processing. To exercise these rights, contact us using the details below.</p>
          </Section>

          <Section title="8. Cookies">
            <p>Our website may use basic cookies or local storage to remember your preferences and keep the booking experience working smoothly. You can control cookies through your browser settings.</p>
          </Section>

          <Section title="9. Children">
            <p>Our services are intended for adults (18 years and older). We do not knowingly collect personal information from children.</p>
          </Section>

          <Section title="10. Changes to this policy">
            <p>We may update this Privacy Policy from time to time. The latest version will always be posted on this page with a new “Last updated” date.</p>
          </Section>

          <Section title="11. Contact us">
            <p>For any privacy questions or requests, contact us at:</p>
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
