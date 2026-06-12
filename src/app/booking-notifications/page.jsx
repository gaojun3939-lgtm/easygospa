"use client"
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
// import { BookingNotification } from "@/entities/BookingNotification";
import { Bell, Phone, Mail, Clock, Calendar, User, CheckCircle, AlertCircle, Star } from "lucide-react";

export default function BookingNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
    //   const data = await BookingNotification.list('-created_date', 50);
    const data = []  
    setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationStatus = async (id, status) => {
    try {
      await BookingNotification.update(id, { notification_status: status });
      loadNotifications();
    } catch (error) {
      console.error('Failed to update notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "all") return true;
    return notification.notification_status === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="pt-32 pb-24 bg-[#F8F2EC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2db83d] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 bg-[#F8F2EC] min-h-screen relative">
         <div style={{backgroundImage:'url(/images/young-woman-hero2.jpg)'}} className="inset-0 w-full h-80 bg-center bg-cover bg-no-repeat bg-fixed -mt-70">
      <div className="inset-0 w-full h-full bg-black/70 flex items-center justify-center">
      </div>
        </div>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-[#0F0F0F] mb-4">
            Booking Notifications
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Manage and track all incoming appointment bookings from your salon website.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {[
            { key: "all", label: "All Notifications", count: notifications.length },
            { key: "pending", label: "Pending", count: notifications.filter(n => n.notification_status === 'pending').length },
            { key: "viewed", label: "Viewed", count: notifications.filter(n => n.notification_status === 'viewed').length },
            { key: "contacted", label: "Contacted", count: notifications.filter(n => n.notification_status === 'contacted').length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 flex items-center gap-2 ${
                filter === tab.key
                  ? 'bg-[#2db83d] text-white shadow-lg'
                  : 'bg-white text-gray-600 hover:bg-[#2db83d]/10 hover:text-[#2db83d] border border-gray-200'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-1 rounded-full text-xs ${
                filter === tab.key ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {filter === "all" 
                ? "No booking notifications yet. They will appear here when customers make appointments."
                : `No ${filter} notifications at the moment.`
              }
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        notification.notification_status === 'pending' ? 'bg-orange-400' :
                        notification.notification_status === 'viewed' ? 'bg-blue-400' :
                        'bg-green-400'
                      }`}></div>
                      <div>
                        <h3 className="font-serif text-xl font-bold text-[#0F0F0F]">
                          New Booking: {notification.service_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Booking ID: #{notification.booking_id?.slice(-8)?.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        notification.notification_status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        notification.notification_status === 'viewed' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {notification.notification_status.charAt(0).toUpperCase() + notification.notification_status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Client Information */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Client Information
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p><strong>Name:</strong> {notification.client_name}</p>
                        <p><strong>Email:</strong> 
                          <a href={`mailto:${notification.client_email}`} className="text-blue-600 hover:underline ml-1">
                            {notification.client_email}
                          </a>
                        </p>
                        <p><strong>Phone:</strong> 
                          <a href={`tel:${notification.client_phone}`} className="text-green-600 hover:underline ml-1">
                            {notification.client_phone}
                          </a>
                        </p>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Appointment Details
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <p><strong>Service:</strong> {notification.service_name}</p>
                        <p><strong>Price:</strong> 
                          <span className="text-[#2db83d] font-bold ml-1">
                            ${new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD'
}).format(notification.service_price?.price)}
                          </span>
                        </p>
                        <p><strong>Duration:</strong> {notification.service_duration}</p>
                        <p><strong>Date:</strong> {formatDate(notification.appointment_date)}</p>
                        <p><strong>Time:</strong> {notification.appointment_time}</p>
                        {notification.special_requests && (
                          <p><strong>Special Requests:</strong> {notification.special_requests}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-100">
                    <a
                      href={`tel:${notification.client_phone}`}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                      <Phone className="w-4 h-4" />
                      Call Client
                    </a>
                    <a
                      href={`mailto:${notification.client_email}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email Client
                    </a>
                    
                    {notification.notification_status === 'pending' && (
                      <button
                        onClick={() => updateNotificationStatus(notification.id, 'viewed')}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Viewed
                      </button>
                    )}
                    
                    {notification.notification_status === 'viewed' && (
                      <button
                        onClick={() => updateNotificationStatus(notification.id, 'contacted')}
                        className="bg-[#2db83d] text-white px-4 py-2 rounded-lg hover:bg-[#45f248] transition-colors flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Mark as Contacted
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}