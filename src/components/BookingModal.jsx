'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, User, Mail, Phone, MessageSquare, Sparkles, Check, MapPin, Users, CreditCard } from 'lucide-react';

const services = [
  { name: 'Swedish Massage', price: 2500, duration: '60 min', category: 'Massage' },
  { name: 'Japanese Head Spa', price: 3500, duration: '90 min', category: 'Massage' },
  { name: 'Thai Dry Massage', price: 3000, duration: '75 min', category: 'Massage' },
  { name: 'Foot Massage', price: 1500, duration: '45 min', category: 'Massage' },
  { name: 'Head and Shoulder Massage', price: 1200, duration: '30 min', category: 'Massage' },
  { name: 'Deep Tissue Massage', price: 3500, duration: '60 min', category: 'Massage' }
];

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM'
];

const therapistOptions = [
  { value: 'any_available', label: 'Any available therapist' },
  { value: 'female_preferred', label: 'Female therapist preferred' },
  { value: 'male_preferred', label: 'Male therapist preferred' }
];

const paymentOptions = [
  { value: 'cash_after_service', label: 'Cash after service' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'qrph', label: 'QR PH' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'card', label: 'Card' },
  { value: 'payment_link', label: 'Payment link' }
];

const areaOptions = ['BGC', 'Makati', 'Taguig', 'Pasay', 'Ortigas', 'Metro Manila'];

function createInitialForm(service = '') {
  return {
    customerName: '',
    email: '',
    phone: '',
    service,
    preferredDate: '',
    preferredTime: '',
    area: '',
    addressNote: '',
    peopleCount: 1,
    therapistPreference: 'any_available',
    paymentMethod: 'cash_after_service',
    notes: ''
  };
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatPaymentMethod(value) {
  return paymentOptions.find(option => option.value === value)?.label || value;
}

export default function BookingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState(createInitialForm());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const handleOpen = () => {
      setFormData(createInitialForm());
      setCreatedAppointment(null);
      setError('');
      setStep(1);
      setIsOpen(true);
    };

    const openBookingModalWithService = event => {
      const serviceName = event?.detail?.service?.name || '';
      setFormData(createInitialForm(serviceName));
      setCreatedAppointment(null);
      setError('');
      setStep(serviceName ? 2 : 1);
      setIsOpen(true);
    };

    window.addEventListener('open-booking-modal', handleOpen);
    window.addEventListener('open-booking-modal-with-service', openBookingModalWithService);

    return () => {
      window.removeEventListener('open-booking-modal', handleOpen);
      window.removeEventListener('open-booking-modal-with-service', openBookingModalWithService);
    };
  }, []);

  const selectedService = services.find(service => service.name === formData.service);

  const handleInputChange = (field, value) => {
    setFormData(current => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.customerName.trim()) return 'Please enter your full name.';
    if (!formData.phone.trim()) return 'Please enter your WhatsApp or phone number.';
    if (formData.email && !formData.email.includes('@')) return 'Please enter a valid email address or leave it blank.';
    if (!formData.service) return 'Please select a service.';
    if (!formData.preferredDate) return 'Please select your preferred date.';
    if (formData.preferredDate < getTodayDate()) return 'Please select today or a future date.';
    if (!formData.preferredTime) return 'Please select your preferred time.';
    if (!formData.area.trim()) return 'Please enter your area.';
    if (!formData.addressNote.trim()) return 'Please enter your building, condo, hotel, or address note.';
    if (!Number(formData.peopleCount) || Number(formData.peopleCount) < 1) return 'Please enter at least 1 person.';
    if (!formData.paymentMethod) return 'Please select a payment method.';
    return null;
  };

  const resetForm = () => {
    setFormData(createInitialForm());
    setStep(1);
    setCreatedAppointment(null);
    setError('');
  };

  const handleClose = () => {
    if (step === 3) resetForm();
    setIsOpen(false);
  };

  const handleSubmit = async event => {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/booking-request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          peopleCount: Number(formData.peopleCount),
          servicePrice: selectedService?.price || 0,
          serviceDurationMinutes: Number.parseInt(selectedService?.duration || '90', 10) || 90,
          metadata: {
            website: 'www.easygospa.com',
            form: 'BookingModal',
            submittedFrom: 'public_website'
          }
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || payload?.ok !== true) {
        throw new Error(payload?.error || 'Booking request could not be submitted.');
      }

      setCreatedAppointment({
        id: payload.reference || payload.bookingRequest?.id || '',
        service: payload.summary?.service || formData.service,
        preferredDate: payload.summary?.preferredDate || formData.preferredDate,
        preferredTime: payload.summary?.preferredTime || formData.preferredTime,
        area: payload.summary?.area || formData.area,
        paymentMethod: payload.summary?.paymentMethod || formData.paymentMethod
      });
      setStep(3);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Booking request could not be submitted.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={event => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 p-5 sm:p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#2db83d]" />
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#0F0F0F]">Book Your Massage</h2>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
                type="button"
                aria-label="Close booking modal"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {error ? (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              ) : null}

              {step === 1 ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-gray-600">Step 1 of 2: Select your service</p>
                  </div>

                  <div className="grid gap-4 max-h-96 overflow-y-auto pr-1">
                    {services.map(service => (
                      <button
                        key={service.name}
                        onClick={() => {
                          handleInputChange('service', service.name);
                          setStep(2);
                        }}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-300 hover:shadow-md ${
                          formData.service === service.name
                            ? 'border-[#2db83d] bg-[#2db83d]/5'
                            : 'border-gray-200 hover:border-[#2db83d]/50'
                        }`}
                        type="button"
                      >
                        <div className="flex justify-between gap-4 items-center">
                          <div>
                            <h3 className="font-serif text-lg font-semibold text-[#0F0F0F]">{service.name}</h3>
                            <p className="text-sm text-gray-500">{service.duration}</p>
                          </div>
                          <div className="text-right text-[#2db83d] font-bold">PHP {service.price.toLocaleString()}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {step === 2 ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-gray-600">Step 2 of 2: Booking details</p>
                    <div className="mt-4 p-4 bg-[#2db83d]/5 rounded-xl">
                      <p className="font-sans text-lg text-[#0F0F0F]">
                        {formData.service || 'Selected service'} {selectedService ? `- PHP ${selectedService.price.toLocaleString()}` : ''}
                      </p>
                      {selectedService ? <p className="text-sm text-gray-600">{selectedService.duration}</p> : null}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><User className="w-4 h-4 inline mr-2" />Full Name *</label>
                        <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" onChange={event => handleInputChange('customerName', event.target.value)} placeholder="Your full name" required type="text" value={formData.customerName} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><Phone className="w-4 h-4 inline mr-2" />WhatsApp / Phone *</label>
                        <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" onChange={event => handleInputChange('phone', event.target.value)} placeholder="+63 917 109 8079" required type="tel" value={formData.phone} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><Mail className="w-4 h-4 inline mr-2" />Email Address (Optional)</label>
                      <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" onChange={event => handleInputChange('email', event.target.value)} placeholder="your@email.com" type="email" value={formData.email} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><Calendar className="w-4 h-4 inline mr-2" />Preferred Date *</label>
                        <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" min={getTodayDate()} onChange={event => handleInputChange('preferredDate', event.target.value)} required type="date" value={formData.preferredDate} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><Clock className="w-4 h-4 inline mr-2" />Preferred Time *</label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" onChange={event => handleInputChange('preferredTime', event.target.value)} required value={formData.preferredTime}>
                          <option value="">Select time</option>
                          {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><MapPin className="w-4 h-4 inline mr-2" />Area *</label>
                        <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" list="easygospa-area-options" onChange={event => handleInputChange('area', event.target.value)} placeholder="BGC, Makati, Taguig..." required value={formData.area} />
                        <datalist id="easygospa-area-options">
                          {areaOptions.map(area => <option key={area} value={area} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><Users className="w-4 h-4 inline mr-2" />People Count *</label>
                        <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" min="1" onChange={event => handleInputChange('peopleCount', event.target.value)} required type="number" value={formData.peopleCount} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><MapPin className="w-4 h-4 inline mr-2" />Building / Condo / Hotel *</label>
                      <input className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" onChange={event => handleInputChange('addressNote', event.target.value)} placeholder="Exact building, condo, hotel, or location note" required value={formData.addressNote} />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Therapist Preference</label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" onChange={event => handleInputChange('therapistPreference', event.target.value)} value={formData.therapistPreference}>
                          {therapistOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2"><CreditCard className="w-4 h-4 inline mr-2" />Payment Method *</label>
                        <select className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d]" onChange={event => handleInputChange('paymentMethod', event.target.value)} required value={formData.paymentMethod}>
                          {paymentOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><MessageSquare className="w-4 h-4 inline mr-2" />Notes (Optional)</label>
                      <textarea className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d] resize-none" onChange={event => handleInputChange('notes', event.target.value)} placeholder="Any special requests or preferences..." rows={3} value={formData.notes} />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button className="flex-1 py-3 px-6 border border-gray-300 rounded-xl font-sans font-medium text-gray-700 hover:bg-gray-50" onClick={() => setStep(1)} type="button">Back</button>
                      <button className="flex-1 py-3 px-6 bg-[#2db83d] text-white rounded-xl font-sans font-medium hover:bg-[#45f248] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" disabled={isSubmitting} type="submit">
                        {isSubmitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : 'Submit Booking Request'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : null}

              {step === 3 ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 py-6 px-2">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
                  </div>

                  <div>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#0F0F0F] mb-2">Booking Request Received</h3>
                    <p className="text-gray-600">Our team will contact you on WhatsApp to confirm therapist availability.</p>
                  </div>

                  <div className="bg-gradient-to-br from-[#2db83d]/10 to-[#45f248]/10 rounded-2xl p-4 md:p-6 text-left border-2 border-[#2db83d]/30 mx-auto max-w-lg shadow-lg">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between gap-4"><strong>Reference:</strong><span className="font-mono text-[#2db83d]">{createdAppointment?.id ? `#${createdAppointment.id}` : 'Pending'}</span></div>
                      <div className="flex justify-between gap-4"><strong>Service:</strong><span className="text-right">{createdAppointment?.service}</span></div>
                      <div className="flex justify-between gap-4"><strong>Date:</strong><span className="text-right">{formatDate(createdAppointment?.preferredDate)}</span></div>
                      <div className="flex justify-between gap-4"><strong>Time:</strong><span>{createdAppointment?.preferredTime}</span></div>
                      <div className="flex justify-between gap-4"><strong>Area:</strong><span>{createdAppointment?.area}</span></div>
                      <div className="flex justify-between gap-4"><strong>Payment:</strong><span className="text-right">{formatPaymentMethod(createdAppointment?.paymentMethod)}</span></div>
                    </div>
                  </div>

                  <button className="w-full max-w-lg py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-sans font-medium hover:bg-gray-200" onClick={handleClose} type="button">Close</button>
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
