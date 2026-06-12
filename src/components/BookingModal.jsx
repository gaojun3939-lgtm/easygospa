'use client'
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Clock, User, Mail, Phone, MessageSquare, Sparkles, Check, Download, Camera } from "lucide-react";
// import { Appointment } from "@/entities/Appointment";
// import { BookingNotification } from "@/entities/BookingNotification";

// Complete EasyGo Spa services list with accurate data
const services = [
  // Massage Services
  { name: "Swedish Massage", price: 2500, duration: "60 min", category: "Massage" },
  { name: "Japanese Head Spa", price: 3500, duration: "90 min", category: "Massage" },
  { name: "Thai Dry Massage", price: 3000, duration: "75 min", category: "Massage" },
  { name: "Foot Massage", price: 1500, duration: "45 min", category: "Massage" },
  { name: "Head and Shoulder Massage", price: 1200, duration: "30 min", category: "Massage" },
  { name: "Deep Tissue Massage", price: 3500, duration: "60 min", category: "Massage" },
  
  
  
];

const timeSlots = [
  "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM"
];

export default function BookingModal() {
  const [isOpen,setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    client_name: "",
    email: "",
    phone: "",
    service: "",
    preferred_date: "",
    preferred_time: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [error, setError] = useState("");
  const [initialService, setInitialService] = React.useState(null);

  const onClose = React.useCallback(() => { setIsOpen(false); 
    //setInitialService(null);
     }, []);

     useEffect(() => {
      const handleOpen = () => {
        setIsOpen((prev) => !prev)
        // set state to open modal, e.g. setIsOpen(true)
      };

      const openBookingModalWithService = (event) => {
        setInitialService(event.detail.service);
        setIsOpen(true);
      };
  
      window.addEventListener("open-booking-modal", handleOpen);
      window.addEventListener('open-booking-modal-with-service', openBookingModalWithService);

      return () => {
        window.removeEventListener("open-booking-modal", handleOpen);
        window.removeEventListener('open-booking-modal-with-service', openBookingModalWithService);
      };
    }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialService) {
        setFormData(prev => ({ ...prev, service: initialService.name }));
        setStep(1); // Skip service selection
      } else {
        resetForm();
      }
      setError("");
    }
  }, [isOpen, initialService]);

  const selectedService = services.find(s => s.name === formData.service);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(""); // Clear error when user starts typing
  };

  const validateForm = () => {
    const { client_name, email, phone, service, preferred_date, preferred_time } = formData;
    
    if (!client_name.trim()) return "Please enter your full name";
    if (!email.trim()) return "Please enter your email address";
    if (!email.includes("@")) return "Please enter a valid email address";
    if (!phone.trim()) return "Please enter your phone number";
    if (!service) return "Please select a service";
    if (!preferred_date) return "Please select your preferred date";
    if (!preferred_time) return "Please select your preferred time";
    
    // Check if date is not in the past
    const selectedDate = new Date(preferred_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return "Please select a future date";
    }
    
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Step 1: Create appointment record in the database
      const appointmentData = {
        ...formData,
        service_price: selectedService?.price,
        duration: selectedService?.duration,
        status: "confirmed"
      };

    //   const appointment = await Appointment.create(appointmentData);
      setCreatedAppointment({});

      // Step 2: Create internal notification for salon management
      try {
        await createInternalNotification(appointment, formData, selectedService);
      } catch (notificationError) {
        console.error('Internal notification creation failed:', notificationError);
        // Don't block the user flow for this
      }

      // Step 3: Show success to user
      setStep(3);
    } catch (error) {
      console.error('Booking submission failed:', error);
      setError('A technical error occurred while submitting your booking. Please try again or call us directly at +63 917 109 8079.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create internal notification instead of sending external emails
  const createInternalNotification = async (appointment, formData, selectedService) => {
    const notificationData = {
      booking_id: appointment.id,
      client_name: formData.client_name,
      client_email: formData.email,
      client_phone: formData.phone,
      service_name: formData.service,
      service_price: selectedService?.price,
      service_duration: selectedService?.duration,
      appointment_date: formData.preferred_date,
      appointment_time: formData.preferred_time,
      special_requests: formData.message || "",
      notification_status: "pending",
      priority: "normal"
    };

    // await BookingNotification.create(notificationData);
    console.log(`✅ Internal booking notification created for booking ID: ${appointment.id}`);
  };

  const resetForm = () => {
    setFormData({
      client_name: "",
      email: "",
      phone: "",
      service: "",
      preferred_date: "",
      preferred_time: "",
      message: ""
    });
    setStep(1);
    setCreatedAppointment(null);
    setError("");
  };

  const handleClose = () => {
    if (step === 3) {
      resetForm();
    }
    onClose();
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const downloadBookingDetails = () => {
    const bookingDetails = `
════════════════════════════════════════════════════
           S E R E N I T Y   S P A   &   S A L O N
════════════════════════════════════════════════════

                ** BOOKING CONFIRMATION **

        We are delighted to confirm your upcoming
        appointment. We look forward to welcoming you.

════════════════════════════════════════════════════
Booking Reference: ${createdAppointment?.id}
Confirmation Date: ${new Date().toLocaleString('en-US', { 
  dateStyle: 'full', 
  timeStyle: 'short' 
})}
════════════════════════════════════════════════════

CLIENT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name:          ${formData.client_name}
Email:         ${formData.email}
Phone:         ${formData.phone}

APPOINTMENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service:       ${createdAppointment?.service}
Investment:    ₱{selectedService?.price?.toLocaleString()}
Duration:      ${selectedService?.duration}
Date:          ${formatDate(createdAppointment?.preferred_date)}
Time:          ${createdAppointment?.preferred_time}
Special Notes: ${formData.message || 'None specified'}

════════════════════════════════════════════════════
                   IMPORTANT INSTRUCTIONS
════════════════════════════════════════════════════

✓ Please arrive 10 minutes prior to your scheduled 
  appointment time for a seamless experience.

✓ This confirmation document MUST be presented at 
  reception upon arrival (digital copy acceptable).

✓ Please bring a valid government-issued photo ID.

✓ For any changes or cancellations, please contact 
  us at least 24 hours in advance.

════════════════════════════════════════════════════
                      FIND US AT:
════════════════════════════════════════════════════
Address:   P-145, Sector A, Metropolitan Co-operative 
           Housing Society Limited, Ho
           Metro Manila, Metro Manila 1229

Phone:     +63 917 109 8079
Email:     easygospa@gmail.com
Website:   www.easygospa.com

Operating Hours:
Monday - Saturday: 9:00 AM - 8:00 PM
Sunday: 10:00 AM - 6:00 PM

════════════════════════════════════════════════════
Thank you for choosing EasyGo Spa. We look forward to 
providing you with an exceptional wellness experience.
════════════════════════════════════════════════════
`;

    const blob = new Blob([bookingDetails], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EASYGO_Appointment_Confirmation_${createdAppointment?.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-100 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-[#2db83d]" />
                <h2 className="font-serif text-2xl font-bold text-[#0F0F0F]">
                  Book Your Appointment
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <p className="text-gray-600">Step 1 of 2: Select Your Service</p>
                  </div>

                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {services.map((service) => (
                      <div
                        key={service.name}
                        onClick={() => {
                          handleInputChange('service', service.name);
                          setStep(2);
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md ${
                          formData.service === service.name
                            ? 'border-[#2db83d] bg-[#2db83d]/5'
                            : 'border-gray-200 hover:border-[#2db83d]/50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-serif text-lg font-semibold text-[#0F0F0F]">
                              {service.name}
                            </h3>
                            <p className="text-sm text-gray-500">{service.duration}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-sans text-xl font-bold text-[#2db83d]">
                              ₱{service.price.toLocaleString()}
                              {service.priceNote && <span className="text-xs text-gray-600 ml-1">{service.priceNote}</span>}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="text-center mb-8">
                    <p className="text-gray-600">Step 2 of 2: Your Details</p>
                    <div className="mt-4 p-4 bg-[#2db83d]/5 rounded-xl">
                      <p className="font-sans text-lg text-[#0F0F0F]">
                        {formData.service} - ₱${selectedService?.price?.toLocaleString()}
                        {selectedService?.priceNote && <span className="text-sm text-gray-600 ml-1">{selectedService.priceNote}</span>}
                      </p>
                      <p className="text-sm text-gray-600">{selectedService?.duration}</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.client_name}
                          onChange={(e) => handleInputChange('client_name', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d] transition-colors duration-300"
                          placeholder="Your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d] transition-colors duration-300"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d] transition-colors duration-300"
                        placeholder="+63 917 109 8079"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-2" />
                          Preferred Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.preferred_date}
                          onChange={(e) => handleInputChange('preferred_date', e.target.value)}
                          min={getTomorrowDate()}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d] transition-colors duration-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Clock className="w-4 h-4 inline mr-2" />
                          Preferred Time *
                        </label>
                        <select
                          required
                          value={formData.preferred_time}
                          onChange={(e) => handleInputChange('preferred_time', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d] transition-colors duration-300"
                        >
                          <option value="">Select time</option>
                          {timeSlots.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        Special Requests (Optional)
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#2db83d] transition-colors duration-300 resize-none"
                        placeholder="Any special requests or preferences..."
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="flex-1 py-3 px-6 border border-gray-300 rounded-xl font-sans font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-3 px-6 bg-[#2db83d] text-white rounded-xl font-sans font-medium hover:bg-[#45f248] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Confirming Booking...
                          </>
                        ) : (
                          'Confirm Booking'
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-4 md:space-y-6 py-6 md:py-8 px-4"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 md:w-10 md:h-10 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="font-serif text-2xl md:text-3xl font-bold text-[#0F0F0F] mb-2">
                      Booking Confirmed!
                    </h3>
                    <p className="text-gray-600 px-2">
                      Thank you, {formData.client_name}. We look forward to seeing you.
                    </p>
                  </div>

                  {/* Professional Booking Summary Card */}
                  <div className="bg-gradient-to-br from-[#2db83d]/10 to-[#45f248]/10 rounded-2xl p-4 md:p-6 text-left border-2 border-[#2db83d]/30 mx-auto max-w-lg shadow-lg">
                    <div className="text-center mb-4">
                      <h4 className="font-serif text-xl font-bold text-[#0F0F0F] mb-1">
                        📋 APPOINTMENT CONFIRMATION
                      </h4>
                      <div className="w-16 h-0.5 bg-[#2db83d] mx-auto"></div>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="bg-white/70 rounded-lg p-3">
                        <div className="flex justify-between items-center mb-2">
                          <strong className="text-gray-700">Booking Reference:</strong>
                          <span className="text-[#45f248] font-bold font-mono text-xs bg-[#45f248]/10 px-2 py-1 rounded">
                            #{createdAppointment?.id?.slice(-8)?.toUpperCase()}
                          </span>
                        </div>
                        <div className="w-full h-[1px] bg-[#2db83d]/30 mb-2"></div>
                        
                        <div className="flex justify-between items-start mb-2">
                          <strong className="text-gray-700">Service:</strong>
                          <span className="text-right pl-2 font-medium">{createdAppointment?.service}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <strong className="text-gray-700">Investment:</strong>
                          <span className="text-[#2db83d] font-bold text-lg">₱{selectedService?.price?.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <strong className="text-gray-700">Duration:</strong>
                          <span className="font-medium">{selectedService?.duration}</span>
                        </div>
                        
                        <div className="w-full h-[1px] bg-[#2db83d]/30 mb-2"></div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <strong className="text-gray-700">Date:</strong>
                          <span className="text-right pl-2 font-medium">{formatDate(createdAppointment?.preferred_date)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <strong className="text-gray-700">Time:</strong>
                          <span className="font-bold text-lg">{createdAppointment?.preferred_time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Screenshot Instructions */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-400 p-4 rounded-lg mx-auto max-w-lg shadow-sm">
                    <div className="flex items-start gap-3">
                      <Camera className="w-8 h-8 text-orange-500 flex-shrink-0 mt-1" />
                      <div className="text-left">
                        <h5 className="font-bold text-orange-800 mb-2 text-base">📱 IMPORTANT: Save This Confirmation</h5>
                        <p className="text-sm text-orange-700 leading-relaxed">
                          Please <strong>screenshot this page</strong> or download the confirmation document below. 
                          You <strong>must present this</strong> at reception when you arrive for your appointment.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4 px-4">
                    <button
                      onClick={downloadBookingDetails}
                      className="w-full py-3 md:py-4 px-6 bg-[#2db83d] text-white rounded-xl font-sans font-medium hover:bg-[#45f248] transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl text-base"
                    >
                      <Download className="w-5 h-5" />
                      Download Confirmation Document
                    </button>

                    <button
                      onClick={handleClose}
                      className="w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-sans font-medium hover:bg-gray-200 transition-colors duration-300"
                    >
                      Close
                    </button>
                  </div>

                  {/* Professional Footer */}
                  <div className="text-xs text-gray-500 pt-6 border-t border-gray-200 space-y-1">
                    <p className="font-bold text-[#2db83d] text-sm">EasyGo Spa Luxury Spa & Salon</p>
                    <p>P-145, Sector A, Metropolitan C.H.S. Ltd.</p>
                    <p> Metro Manila 1229 | +63 917 109 8079</p>
                    <p className="text-[#2db83d] font-medium">Operating Hours: Mon-Sat 9AM-8PM | Sun 10AM-6PM</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}