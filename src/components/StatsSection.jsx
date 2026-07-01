"use client"
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Star, Award, Clock } from "lucide-react";

const stats = [
  { icon: Users, label: "Happy Customers", value: 5000, suffix: "+" },
  { icon: Star, label: "Verified Reviews", value: 0, suffix: "" },
  { icon: Award, label: "Verified Therapists", value: 50, suffix: "+" },
  { icon: Clock, label: "Service Hours", value: 24, suffix: "/7" },
];

const StatsSection = () => {
  const [animatedValues, setAnimatedValues] = useState(stats.map(() => 0));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          stats.forEach((stat, index) => {
            let start = 0;
            const end = stat.value;
            const duration = 2000;
            const stepTime = Math.abs(Math.floor(duration / end));
            let timer;

            timer = setInterval(() => {
              start += 1;
              setAnimatedValues((prev) => {
                const newValues = [...prev];
                newValues[index] = start;
                return newValues;
              });

              if (start === end) {
                clearInterval(timer);
              }
            }, stepTime);
          });
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    const sectionRef = document.querySelector("#stats-section");
    if (sectionRef) {
      observer.observe(sectionRef);
    }

    return () => {
      if (sectionRef) {
        observer.unobserve(sectionRef);
      }
    };
  }, []);

  return (
    <section id="stats-section" style={{backgroundImage:'url(/images/young-woman-hero2.jpg)'}} className="py-16 md:py-20 bg-center bg-cover bg-no-repeat bg-gradient-to-b from-white to-[#FDFCF9] relative overflow-hidden">
      {/* Background Decoration */}
      <div className="z[1] inset-0 absolute w-full h-full bg-gradient-to-b from-[rgba(0,0,0,0.4)] to-[rgba(0,0,0,0.6)]">

      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 0.1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        viewport={{ once: true }}
        className="absolute top-10 right-10"
      >
        <div className="w-64 h-64 bg-[#2db83d] rounded-full blur-3xl" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 z-10 relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-[#2db83d]/80 rounded-full px-4 py-2 mb-6 mx-auto">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              viewport={{ once: true }}
              className=""
            >
              <Users className="w-4 h-4 text-[#020202]" />
            </motion.div>
            <span className="font-sans text-sm text-[#020202] font-medium uppercase tracking-wider">Why Choose EasyGo Spa</span>
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 30, skewY: 5 }}
            whileInView={{ opacity: 1, y: 0, skewY: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="font-serif text-4xl text-white md:text-5xl lg:text-6xl font-bold mb-6"
          >
            Premium Home Massage,
            <br />
            <span className="text-[#2db83d]">Delivered To Your Door</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            viewport={{ once: true }}
            className="font-sans text-xl text-gray-200 max-w-3xl mx-auto leading-relaxed font-bold"
          >
            EasyGo Spa provides professional home massage services across Metro Manila. Our experienced therapists deliver relaxing and wellness-focused treatments directly to your hotel, condo, or home.
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: index * 0.2, type: "spring", stiffness: 100 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -10 }}
              className="text-center group cursor-pointer"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 + 0.3, type: "spring", stiffness: 200 }}
                viewport={{ once: true }}
                whileHover={{ rotate: 360, scale: 1.2 }}
                className="w-16 h-16 mx-auto mb-4 bg-[#2db83d]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#2db83d] transition-all duration-500"
              >
                <stat.icon className="w-8 h-8 text-[#2db83d] group-hover:text-white transition-colors duration-300" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 + 0.5 }}
                viewport={{ once: true }}
                className="space-y-2"
              >
                <motion.p
                  key={`value-${index}`}
                  className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-[#f8f2ecf2] group-hover:text-[#0F0F0F] transition-colors duration-300"
                >
                  {stat.prefix}
                  {animatedValues[index].toLocaleString()}
                  {stat.suffix}
                </motion.p>
                <p className="font-sans text-sm text-gray-300 uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;