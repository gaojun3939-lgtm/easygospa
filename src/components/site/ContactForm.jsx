'use client';

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle, Send } from "lucide-react";
import { whatsappLink } from "@/lib/contactConfig";

// 联系页右边的留言表单（建站模版 serinity 的样子）。
// 老板 2026-07-19:模版原来是假的(等 2 秒假成功,啥都没发)。现在点「发送」= 打开公司 WhatsApp、把内容预填好，
// 客人在 WhatsApp 里再点一次发送才真发出去，所以成功那句写「已打开 WhatsApp」，不写「已发送」。
// 预填的话保持英文（客服看英文），客人看到的字跟着语言走。
const SERVICES = ['Deep tissue', 'Hot Stone Massage', 'Relaxing Premium Aromatherapy Body Massage', 'Shiatsu Massage(without Oil)', 'Swedish Massage', 'Thai Body Massage'];
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', service: '', message: '' };

export default function ContactForm() {
  const t = useTranslations("contact");
  const tn = useTranslations("serviceNames");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const check = () => {
    const next = {};
    if (!form.firstName.trim()) next.firstName = t('errors.firstName');
    if (!form.lastName.trim()) next.lastName = t('errors.lastName');
    if (!form.email.trim()) next.email = t('errors.email');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = t('errors.emailInvalid');
    if (!form.phone.trim()) next.phone = t('errors.phone');
    if (!form.message.trim()) next.message = t('errors.message');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (!check()) return;
    const lines = [
      'New message from EasyGoSpa website:',
      `Name: ${form.firstName} ${form.lastName}`.trim(),
      form.email ? `Email: ${form.email}` : '',
      form.phone ? `Phone: ${form.phone}` : '',
      form.service ? `Interested service: ${form.service}` : '',
      form.message ? `Message: ${form.message}` : '',
    ].filter(Boolean).join('\n');
    window.open(whatsappLink(lines), '_blank', 'noopener');
    setDone(true);
    setForm(EMPTY);
  };

  const field = (name) => `w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 focus:ring-[#64734F]/40 transition-all duration-300 ${errors[name] ? 'border-red-400' : 'border-gray-200 focus:border-[#64734F]'}`;
  const label = "block text-sm font-medium text-gray-700 mb-2";
  const err = (name) => (errors[name] ? <p className="text-red-500 text-sm mt-1">{errors[name]}</p> : null);

  if (done) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-[#64734F] mx-auto mb-4" aria-hidden="true" />
        <h2 className="font-serif text-2xl text-[#0F0F0F] mb-2">{t('sent.title')}</h2>
        <p className="text-gray-600 mb-6">{t('sent.text')}</p>
        <button type="button" onClick={() => setDone(false)} className="text-[#55633F] font-medium underline">{t('sent.again')}</button>
      </div>
    );
  }

  return (
    <>
      <h2 className="font-serif text-[clamp(1.8rem,3.5vw,2.6rem)] text-[#0F0F0F] mb-6">{t('form.title')}</h2>
      <form onSubmit={submit} className="space-y-6" noValidate>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className={label}>{t('form.firstName')}</label>
            <input type="text" id="firstName" name="firstName" value={form.firstName} onChange={change} placeholder={t('form.firstNamePlaceholder')} className={field('firstName')} />
            {err('firstName')}
          </div>
          <div>
            <label htmlFor="lastName" className={label}>{t('form.lastName')}</label>
            <input type="text" id="lastName" name="lastName" value={form.lastName} onChange={change} placeholder={t('form.lastNamePlaceholder')} className={field('lastName')} />
            {err('lastName')}
          </div>
        </div>
        <div>
          <label htmlFor="email" className={label}>{t('form.email')}</label>
          <input type="email" id="email" name="email" value={form.email} onChange={change} placeholder="your@email.com" className={field('email')} />
          {err('email')}
        </div>
        <div>
          <label htmlFor="phone" className={label}>{t('form.phone')}</label>
          <input type="tel" id="phone" name="phone" value={form.phone} onChange={change} placeholder="+63 9XX XXX XXXX" className={field('phone')} />
          {err('phone')}
        </div>
        <div>
          <label htmlFor="service" className={label}>{t('form.service')}</label>
          {/* 选项的值是后台原名（预填给客服看），显示的字跟着语言走 */}
          <select id="service" name="service" value={form.service} onChange={change} className={field('service')}>
            <option value="">{t('form.selectService')}</option>
            {SERVICES.map((name) => <option key={name} value={name}>{tn.has(name) ? tn(name) : name}</option>)}
            <option value="Consultation">{t('form.consultation')}</option>
          </select>
        </div>
        <div>
          <label htmlFor="message" className={label}>{t('form.message')}</label>
          <textarea id="message" name="message" rows={4} value={form.message} onChange={change} placeholder={t('form.messagePlaceholder')} className={`${field('message')} resize-none`} />
          {err('message')}
        </div>
        <button type="submit" className="w-full bg-[#64734F] text-white py-4 rounded-full font-medium hover:bg-[#55633F] transition-all duration-300 shadow-lg flex items-center justify-center gap-2">
          <Send className="w-5 h-5" aria-hidden="true" />
          {t('form.send')}
        </button>
        <p className="text-xs text-gray-500 text-center">{t('form.viaWhatsapp')}</p>
      </form>
    </>
  );
}
