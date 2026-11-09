'use client';

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Instagram, Facebook, Send, CheckCircle } from "lucide-react";
import PageHead from "./PageHead";
import { whatsappLink } from "@/lib/contactConfig";

// 联系页（服务器那层在 app/[locale]/contact/page.jsx，负责网页标题）。
// 表单提交是打开公司 WhatsApp、把内容预填好：预填的话保持英文（客服看英文），客人看到的字跟着语言走。
const SERVICES = ['Deep tissue', 'Hot Stone Massage', 'Relaxing Premium Aromatherapy Body Massage', 'Shiatsu Massage(without Oil)', 'Swedish Massage', 'Thai Body Massage'];

export default function ContactPage() {
  const t = useTranslations("contact");
  const tn = useTranslations("serviceNames");
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('errors.firstName');
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('errors.lastName');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('errors.email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('errors.emailInvalid');
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = t('errors.phone');
    }
    
    if (!formData.message.trim()) {
      newErrors.message = t('errors.message');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      // 老板 2026-07-19:原来是假的(等 2 秒假成功,啥都没发)。改为一键发到 EasyGoSpa
      // WhatsApp(无需邮件服务即刻送达),把表单内容整理好预填。
      const lines = [
        'New message from EasyGoSpa website:',
        `Name: ${formData.firstName} ${formData.lastName}`.trim(),
        formData.email ? `Email: ${formData.email}` : '',
        formData.phone ? `Phone: ${formData.phone}` : '',
        formData.service ? `Interested service: ${formData.service}` : '',
        formData.message ? `Message: ${formData.message}` : ''
      ].filter(Boolean).join('\n');
      window.open(whatsappLink(lines), '_blank', 'noopener');

      setIsSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        service: '',
        message: ''
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialClick = (platform) => {
    // Replace with actual social media links
    const links = {
      instagram: 'https://www.instagram.com/easygospa_services',
      facebook: 'https://web.facebook.com/easygospa'
    };
    
    if (typeof window !== 'undefined') {
      window.open(links[platform], '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="ga ga-page">
      <PageHead eyebrow={t("eyebrow")} title={t("title")}>
        {t("lead")}
      </PageHead>

      <section className="ga-wrap ga-page-sec ga-contact">
        <div className="ga-info">
          <section>
            <h3>{t("area.title")}</h3>
            <b>{t("area.value")}</b>
            <p>{t("area.note")}</p>
          </section>
          <section>
            <h3>{t("whatsapp.title")}</h3>
            <a href="tel:+63 964 857 0967">+63 964 857 0967</a>
            <p>{t("whatsapp.note")}</p>
          </section>
          <section>
            <h3>{t("email.title")}</h3>
            <a href="mailto:services@easygospa.com">services@easygospa.com</a>
            <a href="https://www.easygospa.com/">https://www.easygospa.com/</a>
            <p>{t("email.note")}</p>
          </section>
          <section>
            <h3>{t("hours.title")}</h3>
            <b>{t("hours.value")}</b>
            <p>{t("hours.note")}</p>
          </section>
          <section>
            <h3>{t("follow.title")}</h3>
            <div className="ga-social">
              <button type="button" onClick={() => handleSocialClick('instagram')} aria-label={t("follow.instagram")}><Instagram size={22} /></button>
              <button type="button" onClick={() => handleSocialClick('facebook')} aria-label={t("follow.facebook")}><Facebook size={22} /></button>
            </div>
          </section>
          <figure className="ga-side-pic"><img src="/global/photos/therapist-portrait.webp" alt={t("photoAlt")} loading="lazy" style={{ objectPosition: '72% 35%' }} /></figure>
        </div>

        <div className="ga-form">
          {isSubmitted ? (
            <div className="ga-sent">
              <CheckCircle size={56} />
              <h2>{t("sent.title")}</h2>
              <p>{t("sent.text")}</p>
            </div>
          ) : (
            <>
              <h2>{t("form.title")}</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div className="ga-2col">
                  <div className={`ga-field${errors.firstName ? ' is-bad' : ''}`}>
                    <label htmlFor="firstName">{t("form.firstName")}</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder={t("form.firstNamePlaceholder")} />
                    {errors.firstName && <p className="ga-err">{errors.firstName}</p>}
                  </div>
                  <div className={`ga-field${errors.lastName ? ' is-bad' : ''}`}>
                    <label htmlFor="lastName">{t("form.lastName")}</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder={t("form.lastNamePlaceholder")} />
                    {errors.lastName && <p className="ga-err">{errors.lastName}</p>}
                  </div>
                </div>
                <div className={`ga-field${errors.email ? ' is-bad' : ''}`}>
                  <label htmlFor="email">{t("form.email")}</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="your@email.com" />
                  {errors.email && <p className="ga-err">{errors.email}</p>}
                </div>
                <div className={`ga-field${errors.phone ? ' is-bad' : ''}`}>
                  <label htmlFor="phone">{t("form.phone")}</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+63 964 857 0967" />
                  {errors.phone && <p className="ga-err">{errors.phone}</p>}
                </div>

                <div className="ga-field">
                  <label htmlFor="service">{t("form.service")}</label>
                  <select id="service" name="service" value={formData.service} onChange={handleInputChange}>
                    {/* 选项的值是后台原名（预填给客服看），显示的字跟着语言走 */}
                    <option value="">{t("form.selectService")}</option>
                    {SERVICES.map((name) => <option key={name} value={name}>{tn.has(name) ? tn(name) : name}</option>)}
                    <option value="Consultation">{t("form.consultation")}</option>
                  </select>
                </div>

                <div className={`ga-field${errors.message ? ' is-bad' : ''}`}>
                  <label htmlFor="message">{t("form.message")}</label>
                  <textarea id="message" name="message" rows={4} value={formData.message} onChange={handleInputChange} placeholder={t("form.messagePlaceholder")} />
                  {errors.message && <p className="ga-err">{errors.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="ga-btn ga-btn-big">
                  {isSubmitting ? t("form.sending") : <><Send size={18} /> {t("form.send")}</>}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
