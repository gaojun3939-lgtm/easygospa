'use client';

import React, { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Sparkles, Send, CheckCircle } from "lucide-react";


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
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the form data to your backend
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(formData)
      // });
      
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
      instagram: 'https://instagram.com/EasyGo Spa',
      facebook: 'https://facebook.com/EasyGo Spa'
    };
    
    if (typeof window !== 'undefined') {
      window.open(links[platform], '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <div className="pt-32 pb-24 bg-gradient-to-b from-[#F8F2EC] to-white min-h-screen relative">
      <div style={{backgroundImage:'url(/images/young-woman-hero2.jpg)'}} className="inset-0 w-full h-80 bg-center bg-cover bg-no-repeat bg-fixed -mt-70">
      <div className="inset-0 w-full h-full bg-black/70 flex items-center justify-center">
      </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-[#2db83d]/10 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-[#2db83d]" />
              <span className="text-lg font-medium">Get In Touch</span>
            </div>
            
            <h1 className="font-serif font-medium text-[clamp(2.5rem,5vw,4rem)] text-[#0F0F0F] mb-6 leading-tight">
              Contact EasyGo Spa - The Best Luxury Spa in Metro Manila
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-[1.618]">
              Experience luxury wellness at EasyGo Spa, where premium equipment meets 
              highly skilled professionals for the best organic spa treatments in Metro Manila.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-[clamp(1rem,2vw,2.5rem)]">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-[1.2em]"
            >
              {/* Address */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#2db83d]/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2db83d]/10 rounded-2xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-[#2db83d]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#0F0F0F] mb-2">Visit Our Luxury Spa</h3>
                    <address className="leading-[1.618] text-gray-600 not-italic">
                      P-145, Sector A<br />
                      Metropolitan Co-Operative Housing Society Limited<br />
                       Metro Manila, Metro Manila 1229
                    </address>
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#2db83d]/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2db83d]/10 rounded-2xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-[#2db83d]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#0F0F0F] mb-2">Luxury Booking Line</h3>
                    <div className="leading-[1.618] text-gray-600">
                      <a 
                        href="tel:+919876543210" 
                        className="text-[#2db83d] hover:text-[#45f248] transition-colors duration-300 font-medium"
                      >
                        +63 917 109 8079
                      </a>
                      <br />
                      <span className="text-sm">Premium service available daily</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#2db83d]/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2db83d]/10 rounded-2xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-[#2db83d]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#0F0F0F] mb-2">Concierge Email</h3>
                    <div className="leading-[1.618] text-gray-600">
                      <a 
                        href="mailto:easygospa@gmail.com"
                        className="text-[#2db83d] hover:text-[#45f248] transition-colors duration-300 font-medium"
                      >
                        easygospa.com
                      </a>
                      <br />
                      <span className="text-sm">Premium support within 2 hours</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#2db83d]/20">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#2db83d]/10 rounded-2xl flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#2db83d]" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl font-bold text-[#0F0F0F] mb-2">Luxury Hours</h3>
                    <div className="text-gray-600 space-y-1 leading-[1.618]">
                      <p>Monday - Friday: 10:00 AM - 8:00 PM</p>
                      <p>Saturday: 9:00 AM - 7:00 PM</p>
                      <p>Sunday: 10:00 AM - 6:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#2db83d]/20">
                <h3 className="font-serif text-xl font-bold text-[#0F0F0F] mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <button 
                    onClick={() => handleSocialClick('instagram')}
                    className="w-12 h-12 bg-[#2db83d] rounded-2xl flex items-center justify-center hover:bg-[#45f248] transition-colors duration-300 text-white"
                    aria-label="Follow us on Instagram"
                  >
                    <Instagram className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => handleSocialClick('facebook')}
                    className="w-12 h-12 bg-[#2db83d] rounded-2xl flex items-center justify-center hover:bg-[#45f248] transition-colors duration-300 text-white"
                    aria-label="Follow us on Facebook"
                  >
                    <Facebook className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="bg-white rounded-3xl p-8 shadow-lg border border-[#2db83d]/20"
            >
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h2 className="font-serif text-2xl font-bold text-[#0F0F0F] mb-2">Thank You!</h2>
                  <p className="text-gray-600">Your message has been sent successfully. We'll get back to you within 2 hours.</p>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-bold text-[#0F0F0F] mb-6">Experience Luxury</h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors duration-300 ${
                            errors.firstName 
                              ? 'border-red-300 focus:border-red-500' 
                              : 'border-gray-200 focus:border-[#2db83d]'
                          }`}
                          placeholder="Your first name"
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors duration-300 ${
                            errors.lastName 
                              ? 'border-red-300 focus:border-red-500' 
                              : 'border-gray-200 focus:border-[#2db83d]'
                          }`}
                          placeholder="Your last name"
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors duration-300 ${
                          errors.email 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-200 focus:border-[#2db83d]'
                        }`}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors duration-300 ${
                          errors.phone 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-200 focus:border-[#2db83d]'
                        }`}
                        placeholder="+63 917 109 8079"
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
                        Interested Service
                      </label>
                      <select
                        id="service"
                        name="service"
                        value={formData.service}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d] transition-colors duration-300"
                      >
                        <option value="">Select a service</option>
                        <option value="massage">Massage Therapy</option>
                        <option value="beauty">Beauty & Cosmetics</option>
                        <option value="laser">Laser Hair Removal</option>
                        <option value="nails">Nail Care</option>
                        <option value="hair">Hair Services</option>
                        <option value="consultation">Consultation</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-colors duration-300 resize-none ${
                          errors.message 
                            ? 'border-red-300 focus:border-red-500' 
                            : 'border-gray-200 focus:border-[#2db83d]'
                        }`}
                        placeholder="Tell us about your wellness goals..."
                      />
                      {errors.message && (
                        <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#2db83d] text-white py-4 rounded-xl font-medium hover:bg-[#45f248] transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-[#2db83d] flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}