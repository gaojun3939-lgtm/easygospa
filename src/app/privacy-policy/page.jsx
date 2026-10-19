import { CONTACT_EMAIL, COMPANY_PHONE } from "@/lib/contactConfig";

// 2026-10-19：跟 App 里「条款与政策 › 隐私政策」对齐（D:\APP\src\content\helpArticles.ts，英文为准）。
// Google Play 后台填的隐私政策网址就是这一页，审核员看的是它：App 的数据、技师路上的位置分享、第三方服务商、删号都要写全。
// 官网自己多两样：Meta 像素（广告统计）、网站 Cookie。
export const metadata = {
  title: "Privacy Policy",
  description: "How EasyGoSpa collects, uses, and protects your personal information on our website and in the EasyGoSpa app.",
};

const LAST_UPDATED = "October 19, 2026";
const COMPANY = "EASYGOSPA HOME MASSAGE SERVICES OPC";
const DELETE_URL = "https://app-easygospa.vercel.app/delete-account";

export default function PrivacyPolicyPage() {
  return (
    <main className="pt-28 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <h1 className="font-serif text-4xl font-bold text-[#0F0F0F]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-gray mt-8 space-y-6 text-[15px] leading-7 text-gray-700">
          <p>{COMPANY} (“EasyGoSpa”, “we”, “us”, “our”) runs the EasyGoSpa website, the EasyGoSpa app and its home massage services in Metro Manila, Philippines. This policy explains what personal information we collect, why we collect it, who can see it, how long we keep it, and your rights. It applies to both the website and the app. We follow the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).</p>

          <Section title="1. Information we collect">
            <p>From everyone who books with us or uses the app:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Account: phone number or email; if you sign in with Google, your Google name and profile photo.</li>
              <li>Profile: the name you want to be called, gender and nationality (optional).</li>
              <li>Addresses and location: service addresses you give or save, and your device location when you allow it.</li>
              <li>Bookings: services, times, prices, notes and booking status.</li>
              <li>Messages and reviews: chats about a booking (in the app, on the website, WhatsApp or other channels), and ratings or reviews you leave.</li>
              <li>Device: notification token, app version and basic error logs.</li>
              <li>App usage and advertising: which screens you open and key actions (signing in, viewing a therapist, placing a booking and its amount), your device and advertising identifiers, and which ad or link brought you to the app or website. We use this to measure our ads and improve our services; it does not include your name, phone number or address.</li>
            </ul>
            <p>Additionally from therapists:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Service profile: profile photo, work photos, introduction, services, service area and working hours.</li>
              <li>Identity verification: ID type, legal name, photos of the front and back of the ID, and a selfie.</li>
              <li>Job records: the time and location of arrival, job progress, earnings and platform fee records.</li>
              <li>Live location on the way: from tapping “Depart” until arrival, the therapist’s location is shared with that booking’s customer, including while the app is in the background (a notification shows while this is on). It stops on arrival and we keep only the latest point, not a route.</li>
            </ul>
          </Section>

          <Section title="2. Why we use it">
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide the service: show nearby therapists, match and dispatch bookings, and guide the therapist to your address.</li>
              <li>For safety: verify therapists’ identities and handle disputes or incidents.</li>
              <li>To communicate: send verification codes, booking updates and notices by app notification, SMS, phone or WhatsApp. You can ask us to stop promotional messages at any time.</li>
              <li>For payments and records: calculate earnings and platform fees, and keep records.</li>
              <li>For support: answer your questions and complaints.</li>
              <li>To measure our ads, improve the service and meet legal obligations.</li>
            </ul>
          </Section>

          <Section title="3. Who can see your information">
            <ul className="list-disc pl-5 space-y-1">
              <li>Customers can see a therapist’s public profile: name, photos, introduction, services, rating and approximate distance.</li>
              <li>A therapist sees a customer’s service address and contact details only after accepting that booking.</li>
              <li>ID photos are visible only to the EasyGoSpa staff who review verifications — never to customers or other users.</li>
              <li>Chats about a booking, and a record of when the call button is tapped, may be reviewed by authorized EasyGoSpa staff for safety and to handle disputes. We do not record phone calls.</li>
              <li>We may disclose information if required by law or to protect the safety of our customers, therapists and staff.</li>
              <li>We do not sell your personal information.</li>
            </ul>
          </Section>

          <Section title="4. Service providers we use">
            <p>These providers process only the information needed for their part of the service:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Supabase — account sign-in and data storage (servers in Singapore).</li>
              <li>Google — Google sign-in, maps and location services.</li>
              <li>Semaphore — SMS verification codes in the Philippines.</li>
              <li>Google Firebase Cloud Messaging and Apple Push Notification service — app notifications.</li>
              <li>Google Analytics for Firebase — app usage statistics.</li>
              <li>Firebase Crashlytics — crash reports (device model, app version, error details) so we can fix problems.</li>
              <li>AppsFlyer — measuring which ads and links bring app installs and bookings.</li>
              <li>Meta (Meta Pixel on our website) — measuring which ads bring website bookings.</li>
              <li>Xendit — QR Ph payments of platform fees by therapists.</li>
            </ul>
          </Section>

          <Section title="5. Storage outside the Philippines">
            <p>Our data is stored on servers in Singapore. We use providers that protect data with encryption and access controls, as required by Philippine law.</p>
          </Section>

          <Section title="6. How long we keep it">
            <p>We keep your information while your account is active or while we need it for your bookings. After you delete your account, we delete or anonymize your personal information, except records we must keep by law, for tax, or to resolve disputes.</p>
            <p>In-app chats about a booking are kept for 1 year and photos sent in a chat for 180 days; after that they are deleted automatically.</p>
          </Section>

          <Section title="7. How we protect it">
            <ul className="list-disc pl-5 space-y-1">
              <li>Data is encrypted in transit.</li>
              <li>Access is limited to staff who need it for their work.</li>
              <li>ID photos are kept in a separate private space that cannot be opened from the internet.</li>
            </ul>
            <p>No method of transmission or storage is completely secure, but we work to safeguard your data.</p>
          </Section>

          <Section title="8. Location">
            <p>We use your location only when you allow it — to show nearby therapists and to fill in your address. You can turn location off anytime in your phone or browser settings; you can still book by entering an address. Therapists’ live location is shared only as described in section 1.</p>
          </Section>

          <Section title="9. Cookies and similar technologies">
            <p>Our website uses basic cookies or local storage to remember your preferences and keep the booking experience working, and the Meta Pixel to measure our ads. The app uses device and advertising identifiers for the same purpose. You can control cookies in your browser settings, and reset or limit your advertising identifier in your phone settings.</p>
          </Section>

          <Section title="10. Your rights">
            <p>Under the Data Privacy Act, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Be informed about how your data is used;</li>
              <li>Access your personal information;</li>
              <li>Correct information that is wrong;</li>
              <li>Ask us to delete or block your information;</li>
              <li>Object to processing;</li>
              <li>Get a copy of your data;</li>
              <li>File a complaint with the National Privacy Commission.</li>
            </ul>
            <p>To use these rights, contact us using the details below or through Get help in the app.</p>
          </Section>

          <Section title="11. Deleting your account">
            <p>You can request deletion of your EasyGoSpa account and its data in the app, or on our account deletion page: <a className="text-[#2db83d]" href={DELETE_URL}>{DELETE_URL}</a>. Therapists stop receiving jobs as soon as the request is submitted, and can contact us to withdraw it until we finish processing.</p>
          </Section>

          <Section title="12. Minors">
            <p>Our services are only for people aged 18 and over. We do not knowingly collect information from anyone under 18.</p>
          </Section>

          <Section title="13. Changes to this policy">
            <p>We may update this policy from time to time. The latest version is always posted on this page with a new “Last updated” date, and we will tell you in the app before important changes take effect.</p>
          </Section>

          <Section title="14. Contact us">
            <p>For any privacy questions or requests, contact us at:</p>
            <p className="font-medium text-[#0F0F0F]">{COMPANY}</p>
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
