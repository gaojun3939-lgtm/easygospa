'use client';

import React, { useState } from "react";
import { Instagram, Facebook, Send, CheckCircle } from "lucide-react";
import PageHead from "../../components/global/PageHead";
import { whatsappLink } from "@/lib/contactConfig";


export default function Contact() {
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
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
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
      <PageHead eyebrow="Get In Touch" title="Contact EasyGoSpa - Professional Home Massage in Metro Manila">
        Book a trained massage therapist to your hotel, condo, home, or office.
        Message us for availability, service details, and booking assistance.
      </PageHead>

      <section className="ga-wrap ga-page-sec ga-contact">
        <div className="ga-info">
          <section>
            <h3>Service Area</h3>
            <b>Metro Manila</b>
            <p>Home, condo, hotel, and office massage service. Enter your address during booking to check availability. No transport fee.</p>
          </section>
          <section>
            <h3>Booking &amp; WhatsApp</h3>
            <a href="tel:+63 964 857 0967">+63 964 857 0967</a>
            <p>Message us anytime to book or ask about therapist availability.</p>
          </section>
          <section>
            <h3>Email Support</h3>
            <a href="mailto:services@easygospa.com">services@easygospa.com</a>
            <a href="https://www.easygospa.com/">https://www.easygospa.com/</a>
            <p>For booking questions, service details, and business inquiries.</p>
          </section>
          <section>
            <h3>Service Hours</h3>
            <b>24 Hours / 7 Days</b>
            <p>Online booking and message support are available 24/7. Therapist availability may vary by area and time.</p>
          </section>
          <section>
            <h3>Follow Us</h3>
            <div className="ga-social">
              <button type="button" onClick={() => handleSocialClick('instagram')} aria-label="Follow us on Instagram"><Instagram size={22} /></button>
              <button type="button" onClick={() => handleSocialClick('facebook')} aria-label="Follow us on Facebook"><Facebook size={22} /></button>
            </div>
          </section>
        </div>

        <div className="ga-form">
          {isSubmitted ? (
            <div className="ga-sent">
              <CheckCircle size={56} />
              <h2>Thank You!</h2>
              <p>Your message has been sent successfully. We'll get back to you within 2 hours.</p>
            </div>
          ) : (
            <>
              <h2>Send Us a Message</h2>
              <form onSubmit={handleSubmit} noValidate>
                <div className="ga-2col">
                  <div className={`ga-field${errors.firstName ? ' is-bad' : ''}`}>
                    <label htmlFor="firstName">First Name *</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Your first name" />
                    {errors.firstName && <p className="ga-err">{errors.firstName}</p>}
                  </div>
                  <div className={`ga-field${errors.lastName ? ' is-bad' : ''}`}>
                    <label htmlFor="lastName">Last Name *</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Your last name" />
                    {errors.lastName && <p className="ga-err">{errors.lastName}</p>}
                  </div>
                </div>
                <div className={`ga-field${errors.email ? ' is-bad' : ''}`}>
                  <label htmlFor="email">Email Address *</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="your@email.com" />
                  {errors.email && <p className="ga-err">{errors.email}</p>}
                </div>
                <div className={`ga-field${errors.phone ? ' is-bad' : ''}`}>
                  <label htmlFor="phone">Phone Number *</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+63 964 857 0967" />
                  {errors.phone && <p className="ga-err">{errors.phone}</p>}
                </div>

                <div className="ga-field">
                  <label htmlFor="service">Interested Service</label>
                  <select id="service" name="service" value={formData.service} onChange={handleInputChange}>
                    {/* 2026-10-26:原来是建站模板的美容 / 激光脱毛 / 美甲 / 美发,换成后台在售的 6 个按摩项目(名字照后台原样) */}
                    <option value="">Select a service</option>
                    <option value="Deep tissue">Deep tissue</option>
                    <option value="Hot Stone Massage">Hot Stone Massage</option>
                    <option value="Relaxing Premium Aromatherapy Body Massage">Relaxing Premium Aromatherapy Body Massage</option>
                    <option value="Shiatsu Massage(without Oil)">Shiatsu Massage(without Oil)</option>
                    <option value="Swedish Massage">Swedish Massage</option>
                    <option value="Thai Body Massage">Thai Body Massage</option>
                    <option value="Consultation">Consultation</option>
                  </select>
                </div>

                <div className={`ga-field${errors.message ? ' is-bad' : ''}`}>
                  <label htmlFor="message">Message *</label>
                  <textarea id="message" name="message" rows={4} value={formData.message} onChange={handleInputChange} placeholder="Tell us your preferred service, location, date, and time." />
                  {errors.message && <p className="ga-err">{errors.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="ga-btn ga-btn-big">
                  {isSubmitting ? 'Sending...' : <><Send size={18} /> Send Message</>}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
