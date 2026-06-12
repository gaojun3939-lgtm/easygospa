"use client"
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AnimatedFlower = () => (
  <motion.svg
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-[#2db83d]"
  >
    {/* Outer Flower Petals */}
    <motion.ellipse
      cx="60"
      cy="30"
      rx="12"
      ry="25"
      fill="currentColor"
      opacity="0.8"
      initial={{ scale: 0, rotate: 0 }}
      animate={{ 
        scale: [0.7, 1.1, 1],
        rotate: [0, 360]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="85"
      cy="45"
      rx="12"
      ry="25"
      fill="currentColor"
      opacity="0.8"
      initial={{ scale: 0, rotate: 45 }}
      animate={{ 
        scale: [0.7, 1.1, 1],
        rotate: [45, 405]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.2
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="90"
      cy="60"
      rx="12"
      ry="25"
      fill="currentColor"
      opacity="0.8"
      initial={{ scale: 0, rotate: 90 }}
      animate={{ 
        scale: [0.7, 1.1, 1],
        rotate: [90, 450]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.4
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="85"
      cy="75"
      rx="12"
      ry="25"
      fill="currentColor"
      opacity="0.8"
      initial={{ scale: 0, rotate: 135 }}
      animate={{ 
        scale: [0.7, 1.1, 1],
        rotate: [135, 495]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.6
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="60"
      cy="90"
      rx="12"
      ry="25"
      fill="currentColor"
      opacity="0.8"
      initial={{ scale: 0, rotate: 180 }}
      animate={{ 
        scale: [0.7, 1.1, 1],
        rotate: [180, 540]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.8
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="35"
      cy="75"
      rx="12"
      ry="25"
      fill="currentColor"
      opacity="0.8"
      initial={{ scale: 0, rotate: 225 }}
      animate={{ 
        scale: [0.7, 1.1, 1],
        rotate: [225, 585]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.0
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="30"
      cy="60"
      rx="12"
      ry="25"
      fill="currentColor"
      opacity="0.8"
      initial={{ scale: 0, rotate: 270 }}
      animate={{ 
        scale: [0.7, 1.1, 1],
        rotate: [270, 630]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.2
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="35"
      cy="45"
      rx="12"
      ry="25"
      fill="currentColor"
      opacity="0.8"
      initial={{ scale: 0, rotate: 315 }}
      animate={{ 
        scale: [0.7, 1.1, 1],
        rotate: [315, 675]
      }}
      transition={{ 
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.4
      }}
      style={{ transformOrigin: "60px 60px" }}
    />

    {/* Inner Flower Petals - Smaller and Different Color */}
    <motion.ellipse
      cx="60"
      cy="40"
      rx="8"
      ry="18"
      fill="#45f248"
      opacity="0.9"
      initial={{ scale: 0, rotate: 22.5 }}
      animate={{ 
        scale: [0.8, 1.05, 1],
        rotate: [22.5, -337.5]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.1
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="75"
      cy="50"
      rx="8"
      ry="18"
      fill="#45f248"
      opacity="0.9"
      initial={{ scale: 0, rotate: 67.5 }}
      animate={{ 
        scale: [0.8, 1.05, 1],
        rotate: [67.5, -292.5]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.3
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="80"
      cy="60"
      rx="8"
      ry="18"
      fill="#45f248"
      opacity="0.9"
      initial={{ scale: 0, rotate: 112.5 }}
      animate={{ 
        scale: [0.8, 1.05, 1],
        rotate: [112.5, -247.5]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.5
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="75"
      cy="70"
      rx="8"
      ry="18"
      fill="#45f248"
      opacity="0.9"
      initial={{ scale: 0, rotate: 157.5 }}
      animate={{ 
        scale: [0.8, 1.05, 1],
        rotate: [157.5, -202.5]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.7
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="60"
      cy="80"
      rx="8"
      ry="18"
      fill="#45f248"
      opacity="0.9"
      initial={{ scale: 0, rotate: 202.5 }}
      animate={{ 
        scale: [0.8, 1.05, 1],
        rotate: [202.5, -157.5]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.9
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="45"
      cy="70"
      rx="8"
      ry="18"
      fill="#45f248"
      opacity="0.9"
      initial={{ scale: 0, rotate: 247.5 }}
      animate={{ 
        scale: [0.8, 1.05, 1],
        rotate: [247.5, -112.5]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.1
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="40"
      cy="60"
      rx="8"
      ry="18"
      fill="#45f248"
      opacity="0.9"
      initial={{ scale: 0, rotate: 292.5 }}
      animate={{ 
        scale: [0.8, 1.05, 1],
        rotate: [292.5, -67.5]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.3
      }}
      style={{ transformOrigin: "60px 60px" }}
    />
    
    <motion.ellipse
      cx="45"
      cy="50"
      rx="8"
      ry="18"
      fill="#45f248"
      opacity="0.9"
      initial={{ scale: 0, rotate: 337.5 }}
      animate={{ 
        scale: [0.8, 1.05, 1],
        rotate: [337.5, -22.5]
      }}
      transition={{ 
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.5
      }}
      style={{ transformOrigin: "60px 60px" }}
    />

    {/* Flower Center */}
    <motion.circle
      cx="60"
      cy="60"
      r="12"
      fill="#FFD700"
      initial={{ scale: 0 }}
      animate={{ 
        scale: [0.5, 1.2, 1],
        opacity: [0.7, 1, 0.9]
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay: 1
      }}
    />

    {/* Center Details */}
    <motion.circle
      cx="60"
      cy="60"
      r="8"
      fill="#FFA500"
      animate={{ 
        scale: [1, 1.1, 1],
        opacity: [0.8, 1, 0.8]
      }}
      transition={{ 
        duration: 1.5, 
        repeat: Infinity, 
        ease: "easeInOut",
        delay: 1.2
      }}
    />

    {/* Floating Sparkles */}
    <motion.circle
      cx="25"
      cy="25"
      r="2"
      fill="currentColor"
      opacity="0.6"
      animate={{
        y: [-8, 8, -8],
        x: [-3, 3, -3],
        opacity: [0.3, 0.9, 0.3],
        scale: [0.5, 1.2, 0.5]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    
    <motion.circle
      cx="95"
      cy="30"
      r="1.5"
      fill="#45f248"
      opacity="0.7"
      animate={{
        y: [5, -5, 5],
        x: [2, -2, 2],
        opacity: [0.4, 0.8, 0.4],
        scale: [0.8, 1.5, 0.8]
      }}
      transition={{
        duration: 3.5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1
      }}
    />
    
    <motion.circle
      cx="100"
      cy="90"
      r="2.5"
      fill="currentColor"
      opacity="0.5"
      animate={{
        y: [-6, 6, -6],
        x: [-4, 4, -4],
        opacity: [0.2, 0.7, 0.2],
        scale: [0.6, 1.3, 0.6]
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 0.5
      }}
    />
    
    <motion.circle
      cx="20"
      cy="95"
      r="1.8"
      fill="#FFD700"
      opacity="0.8"
      animate={{
        y: [4, -8, 4],
        x: [3, -3, 3],
        opacity: [0.5, 1, 0.5],
        scale: [0.7, 1.4, 0.7]
      }}
      transition={{
        duration: 3.8,
        repeat: Infinity,
        ease: "easeInOut",
        delay: 1.5
      }}
    />
  </motion.svg>
);

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [loading,onLoadingComplete] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onLoadingComplete(true), 10);
          }, 10);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onLoadingComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 bg-gradient-to-br from-[#F8F2EC] via-white to-[#F5E6D8] z-60 flex flex-col md:hidden items-center justify-center"
        >
          {/* Logo and Flower Animation */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative">
              <AnimatedFlower />
              
              {/* Subtle glow effect behind flower */}
              <div className="absolute inset-0 bg-gradient-radial from-[#2db83d]/30 via-[#45f248]/20 to-transparent rounded-full blur-2xl scale-150 -z-10" />
            </div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-center mt-6"
            >
              <h1 className="font-serif text-4xl font-bold text-[#2db83d] mb-2">
                EasyGo Spa
              </h1>
              <p className="text-sm text-gray-600 tracking-widest uppercase">
                Luxury Spa & Salon
              </p>
            </motion.div>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-64 h-1 bg-gray-200 rounded-full overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-[#2db83d] to-[#45f248] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </motion.div>

          {/* Loading Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-sm text-gray-500 mt-4 font-medium"
          >
            Preparing your luxury experience...
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}