"use client"
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, Bot, User } from "lucide-react";
// import { Appointment } from "@/entities/Appointment";
// import { InvokeLLM } from "@/integrations/Core";

// Complete EasyGo Spa Services Menu (Updated with SEO Descriptions)
const services = [
  // Massage Services
  { name: "Swedish Massage", price: 2500, duration: "60 min", category: "Massage", description: "Indulge in a timeless classic at Metro Manila's premier wellness destination. Our Swedish Massage utilizes masterful, flowing strokes and gentle kneading to dissolve muscle tension, enhance circulation, and guide you to a state of profound relaxation." },
  { name: "Japanese Head Spa", price: 3500, duration: "90 min", category: "Massage", description: "Embark on a transcendent sensory journey with our state-of-the-art Japanese Head Spa. Submerge your senses in a sanctuary of tranquility as a therapeutic waterfall, enriched with potent organic elixirs, bathes your scalp and hair under the ethereal glow of chromotherapy lighting." },
  { name: "Thai Dry Massage", price: 3000, duration: "75 min", category: "Massage", description: "Experience the ancient art of healing with our authentic Thai Dry Massage in Metro Manila. This traditional, oil-free therapy combines rhythmic acupressure, gentle rocking, and assisted yoga stretches to unblock energy pathways and relieve deep-seated tension." },
  { name: "Foot Massage", price: 1500, duration: "45 min", category: "Massage", description: "Revitalize your entire being with our specialized Foot Massage, based on ancient reflexology techniques to alleviate fatigue and promote overall wellness in the comfort of your own space." },
  { name: "Head and Shoulder Massage", price: 1200, duration: "30 min", category: "Massage", description: "Melt away modern life's stresses with our targeted Head and Shoulder Massage. This therapy provides immediate relief from headaches, stiffness, and digital fatigue." },
  { name: "Deep Tissue Massage", price: 3500, duration: "60 min", category: "Massage", description: "For powerful relief from chronic pain, our Deep Tissue Massage uses slow, deliberate strokes to target inner muscle layers. Ideal for athletes and those with persistent knots." },

  // Beauty & Cosmetic Services
  { name: "Lash Extension", price: 2000, duration: "120 min", category: "Beauty", description: "Achieve breathtaking volume with our premium Lash Extension service in Metro Manila. Our master artists create a customized, natural-looking glamour that saves you time on your makeup routine." },
  { name: "Lash Lift", price: 1500, duration: "60 min", category: "Beauty", description: "Elevate your natural beauty with a Lash Lift. This semi-permanent treatment curls your natural lashes from the root, creating an illusion of longer, thicker lashes." },
  { name: "Microblading", price: 6500, duration: "180 min", category: "Beauty", description: "Redefine your arches with our expert Microblading service. Our certified artists create incredibly fine, hair-like strokes for perfectly shaped, fuller-looking semi-permanent brows." },
  { name: "Microshading", price: 6500, duration: "180 min", category: "Beauty", description: "For a soft, powdered makeup look, our Microshading technique uses a machine to create a beautifully filled-in, gradient brow. Ideal for sensitive or oily skin." },
  { name: "Combine Brows", price: 7500, duration: "200 min", category: "Beauty", description: "Experience the best of both worlds with our Combine Brows treatment, blending the natural hair-strokes of microblading with the soft fill of microshading for ultimate definition." },
  { name: "Touch Up", price: 3000, duration: "60 min", category: "Beauty", description: "Maintain the perfection of your semi-permanent makeup with our essential Touch Up service, crucial for reinforcing pigment and ensuring longevity." },
  { name: "Lip Neutralisation / Lip Blush", price: 5000, duration: "120 min", category: "Beauty", description: "Awaken your smile with our Lip Blush service. We enhance your natural lip shape and colour, creating the illusion of fuller, more youthful lips 24/7." },

  // Laser Hair Removal
  { name: "Underarm Laser", price: 1000, duration: "30 min", category: "Laser", description: "Embrace flawlessly smooth underarms with our advanced, pain-free laser hair removal, providing a safe and permanent solution to unwanted hair." },
  { name: "Bikini Laser", price: 2000, duration: "45 min", category: "Laser", description: "Achieve ultimate confidence with our discreet and professional Bikini Laser hair removal, using cutting-edge equipment for a comfortable experience and lasting results." },
  { name: "Full Leg Laser", price: 2000, duration: "90 min", category: "Laser", description: "Experience the luxury of permanently smooth legs. Our Full Leg Laser treatment offers a lifetime of convenience and confidence." },
  { name: "Half Leg Laser", price: 1500, duration: "60 min", category: "Laser", description: "Perfect for targeting either your lower or upper legs, our Half Leg Laser service offers remarkable, permanent hair reduction where you need it most." },
  { name: "Full Arm Laser", price: 1500, duration: "60 min", category: "Laser", description: "Enjoy beautifully smooth arms all year round with our safe, effective, and permanent Full Arm Laser hair removal service." },
  { name: "Full Face Laser", price: 1500, duration: "45 min", category: "Laser", description: "Reveal a flawless complexion with our gentle Full Face Laser treatment, removing unwanted hair for smoother skin and better makeup application." },
  { name: "Full Back Laser", price: 2000, duration: "75 min", category: "Laser", description: "Achieve a smooth, clear back with our comprehensive Full Back Laser hair removal, giving you the confidence to go backless anytime." },
  { name: "Stomach Laser", price: 2000, duration: "45 min", category: "Laser", description: "Gain confidence with our effective and discreet Stomach Laser hair removal, leading to smoother, clearer skin in the abdominal area." },
  { name: "Upper Lip Laser", price: 900, duration: "15 min", category: "Laser", description: "Address a common beauty concern with our quick and precise Upper Lip Laser treatment, a long-term solution superior to traditional methods." },
  { name: "Full Body Laser", price: 12999, duration: "240 min", category: "Laser", description: "Embrace the ultimate in smoothness with our Full Body Laser package, a comprehensive and luxurious path to a lifetime of hair-free living." },

  // Nail Services
  { name: "Soft Gel Extension", price: 1200, duration: "90 min", category: "Nails", description: "Achieve elegantly long, natural-looking nails with our lightweight and durable Soft Gel Extensions, which are kinder to your natural nails." },
  { name: "Acrylic Extension", price: 1500, duration: "120 min", category: "Nails", description: "For dramatic length and ultimate durability, our expert nail technicians sculpt strong, beautiful Acrylic Extensions perfect for a glamorous look." },
  { name: "Gel Polish", price: 500, duration: "45 min", category: "Nails", description: "Enjoy weeks of flawless, chip-free colour with our premium Gel Polish service, offering a high-gloss, incredibly durable finish." },
  { name: "Nail Remove", price: 150, duration: "30 min", category: "Nails", description: "Ensure the health of your natural nails with our professional Nail Remove service, which safely removes extensions and finishes with a nourishing treatment." },
  { name: "Manicure", price: 800, duration: "60 min", category: "Nails", description: "Treat your hands to our classic Manicure, a ritual including nail shaping, cuticle care, a soothing hand massage, and flawless polish application." },
  { name: "Manicure with Whitening Pack", price: 1000, duration: "75 min", category: "Nails", description: "Elevate your manicure with our exclusive Whitening Pack, using a potent, natural mask to reduce pigmentation and reveal brighter, youthful-looking skin." },
  { name: "Pedicure", price: 1200, duration: "75 min", category: "Nails", description: "Rejuvenate tired feet with our luxurious Pedicure, including a warm soak, exfoliation, callus removal, a relaxing massage, and perfect polish." },
  { name: "Pedicure with Whitening Pack", price: 1500, duration: "90 min", category: "Nails", description: "Unveil brighter feet with our signature Pedicure with Whitening Pack, targeting tan and discoloration for visibly softer, revitalized skin." },

  // Hair Services
  { name: "Women Hair Cut", price: 800, duration: "60 min", category: "Hair", description: "Transform your look with a bespoke Women's Hair Cut from our master stylists, crafted to perfectly complement your features and lifestyle." },
  { name: "Men Hair Cut", price: 500, duration: "45 min", category: "Hair", description: "Experience modern barbering with our expert Men's Hair Cut, delivering a sharp, tailored cut that includes a relaxing wash and professional styling." },
  { name: "Hair Wash", price: 300, duration: "30 min", category: "Hair", description: "Indulge in the luxury of a professional Hair Wash using premium organic products, combined with a relaxing scalp massage for a moment of bliss." },
  { name: "Hair Wash & Style", price: 700, duration: "60 min", category: "Hair", description: "Perfect for any occasion, our Hair Wash & Style service leaves you with a salon-perfect blowout or style of your choice." },
  { name: "Hair Perming", price: 2500, duration: "180 min", category: "Hair", description: "Create lasting texture, from soft waves to bouncy curls, with our expert Hair Perming services, using advanced, gentle formulas.", priceNote: "Starting" },
  { name: "Hair Straightening", price: 3000, duration: "240 min", category: "Hair", description: "Achieve sleek, frizz-free hair with our professional Hair Straightening treatments, including keratin smoothing for a smooth, glossy mane.", priceNote: "Starting" },
  { name: "Hair Colouring", price: 3500, duration: "180 min", category: "Hair", description: "Express your style with our bespoke Hair Colouring services, using premium, low-ammonia products for stunning, luminous results.", priceNote: "Starting" },
  { name: "Hair Highlight", price: 4000, duration: "240 min", category: "Hair", description: "Illuminate your hair with our professional Hair Highlighting services, mastering techniques like balayage and foiling for a natural or bold look.", priceNote: "Starting" },
  { name: "Hair Extension", price: 1499, duration: "120 min", category: "Hair", description: "Instantly add luxurious length and volume with our premium, 100% human Hair Extensions, expertly applied for a seamless, natural blend.", priceNote: "Starting" },
  { name: "Hair Spa", price: 1500, duration: "90 min", category: "Hair", description: "Revive your hair with our signature Hair Spa treatment, an intensive conditioning ritual that repairs damage and restores moisture for incredible softness and shine.", priceNote: "Starting" },
  { name: "Keratin Treatment", price: 3000, duration: "240 min", category: "Hair", description: "Tame frizz for months with our transformative Keratin Treatment, which infuses your hair with protein for a sleek, glossy finish.", priceNote: "Starting" }
];

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm EasyGo Spa, your AI assistant at EasyGo Spa. I can help you with:\n\n🔹 Book appointments for any of our 42+ services\n🔹 Check service prices and details\n🔹 Find your existing bookings\n🔹 Get directions and contact info\n🔹 Learn about our organic treatments\n🔹 Answer wellness questions\n\nHow can I assist you today?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSystemPrompt = async () => {
    // Get current appointments for context
    // const recentAppointments = await Appointment.list("-created_date", 50);
    const recentAppointments = []
    return `You are EasyGo Spa, an AI assistant for EasyGo Spa, Metro Manila's premier luxury wellness destination specializing in organic spa treatments. You are friendly, professional, knowledgeable about wellness and beauty, and always helpful.

EasyGo Spa Information:
- Location: P-145, Sector A, Metropolitan Co-Operative Housing Society Limited,  Metro Manila, Metro Manila 1229
- Phone: +63 964 857 0967
- Email: easygospa@gmail.com
- Hours: 
  * Available 24/7
  * Service Hours: 24 Hours Daily  
  * Book Anytime, Day or Night
- Specializes in: 100% organic, chemical-free treatments using state-of-the-art equipment and highly skilled professionals

Complete Services Menu (42+ Services):

MASSAGE THERAPY:
- Swedish Massage: $2,500 (60 min) - Indulge in a timeless classic at Metro Manila's premier wellness destination. Our Swedish Massage utilizes masterful, flowing strokes and gentle kneading to dissolve muscle tension, enhance circulation, and guide you to a state of profound relaxation.
- Japanese Head Spa: $3,500 (90 min) - Embark on a transcendent sensory journey with our state-of-the-art Japanese Head Spa. Submerge your senses in a sanctuary of tranquility as a therapeutic waterfall, enriched with potent organic elixirs, bathes your scalp and hair under the ethereal glow of chromotherapy lighting.
- Thai Dry Massage: $3,000 (75 min) - Experience the ancient art of healing with our authentic Thai Dry Massage in Metro Manila. This traditional, oil-free therapy combines rhythmic acupressure, gentle rocking, and assisted yoga stretches to unblock energy pathways and relieve deep-seated tension.
- Foot Massage: $1,500 (45 min) - Revitalize your entire being with our specialized Foot Massage, based on ancient reflexology techniques to alleviate fatigue and promote overall wellness in the comfort of your own space.
- Head and Shoulder Massage: $1,200 (30 min) - Melt away modern life's stresses with our targeted Head and Shoulder Massage. This therapy provides immediate relief from headaches, stiffness, and digital fatigue.
- Deep Tissue Massage: $3,500 (60 min) - For powerful relief from chronic pain, our Deep Tissue Massage uses slow, deliberate strokes to target inner muscle layers. Ideal for athletes and those with persistent knots.

BEAUTY & COSMETICS:
- Lash Extension: $2,000 (120 min) - Achieve breathtaking volume with our premium Lash Extension service in Metro Manila. Our master artists create a customized, natural-looking glamour that saves you time on your makeup routine.
- Lash Lift: $1,500 (60 min) - Elevate your natural beauty with a Lash Lift. This semi-permanent treatment curls your natural lashes from the root, creating an illusion of longer, thicker lashes.
- Microblading: $6,500 (180 min) - Redefine your arches with our expert Microblading service. Our certified artists create incredibly fine, hair-like strokes for perfectly shaped, fuller-looking semi-permanent brows.
- Microshading: $6,500 (180 min) - For a soft, powdered makeup look, our Microshading technique uses a machine to create a beautifully filled-in, gradient brow. Ideal for sensitive or oily skin.
- Combine Brows: $7,500 (200 min) - Experience the best of both worlds with our Combine Brows treatment, blending the natural hair-strokes of microblading with the soft fill of microshading for ultimate definition.
- Touch Up: $3,000 (60 min) - Maintain the perfection of your semi-permanent makeup with our essential Touch Up service, crucial for reinforcing pigment and ensuring longevity.
- Lip Neutralisation/Lip Blush: $5,000 (120 min) - Awaken your smile with our Lip Blush service. We enhance your natural lip shape and colour, creating the illusion of fuller, more youthful lips 24/7.

LASER HAIR REMOVAL:
- Underarm Laser: $1,000 (30 min) - Embrace flawlessly smooth underarms with our advanced, pain-free laser hair removal, providing a safe and permanent solution to unwanted hair.
- Bikini Laser: $2,000 (45 min) - Achieve ultimate confidence with our discreet and professional Bikini Laser hair removal, using cutting-edge equipment for a comfortable experience and lasting results.
- Full Leg Laser: $2,000 (90 min) - Experience the luxury of permanently smooth legs. Our Full Leg Laser treatment offers a lifetime of convenience and confidence.
- Half Leg Laser: $1,500 (60 min) - Perfect for targeting either your lower or upper legs, our Half Leg Laser service offers remarkable, permanent hair reduction where you need it most.
- Full Arm Laser: $1,500 (60 min) - Enjoy beautifully smooth arms all year round with our safe, effective, and permanent Full Arm Laser hair removal service.
- Full Face Laser: $1,500 (45 min) - Reveal a flawless complexion with our gentle Full Face Laser treatment, removing unwanted hair for smoother skin and better makeup application.
- Full Back Laser: $2,000 (75 min) - Achieve a smooth, clear back with our comprehensive Full Back Laser hair removal, giving you the confidence to go backless anytime.
- Stomach Laser: $2,000 (45 min) - Gain confidence with our effective and discreet Stomach Laser hair removal, leading to smoother, clearer skin in the abdominal area.
- Upper Lip Laser: $900 (15 min) - Address a common beauty concern with our quick and precise Upper Lip Laser treatment, a long-term solution superior to traditional methods.
- Full Body Laser: $12,999 (240 min) - Embrace the ultimate in smoothness with our Full Body Laser package, a comprehensive and luxurious path to a lifetime of hair-free living.

NAIL SERVICES:
- Soft Gel Extension: $1,200 (90 min) - Achieve elegantly long, natural-looking nails with our lightweight and durable Soft Gel Extensions, which are kinder to your natural nails.
- Acrylic Extension: $1,500 (120 min) - For dramatic length and ultimate durability, our expert nail technicians sculpt strong, beautiful Acrylic Extensions perfect for a glamorous look.
- Gel Polish: $500 (45 min) - Enjoy weeks of flawless, chip-free colour with our premium Gel Polish service, offering a high-gloss, incredibly durable finish.
- Nail Remove: $150 (30 min) - Ensure the health of your natural nails with our professional Nail Remove service, which safely removes extensions and finishes with a nourishing treatment.
- Manicure: $800 (60 min) - Treat your hands to our classic Manicure, a ritual including nail shaping, cuticle care, a soothing hand massage, and flawless polish application.
- Manicure with Whitening Pack: $1,000 (75 min) - Elevate your manicure with our exclusive Whitening Pack, using a potent, natural mask to reduce pigmentation and reveal brighter, youthful-looking skin.
- Pedicure: $1200 (75 min) - Rejuvenate tired feet with our luxurious Pedicure, including a warm soak, exfoliation, callus removal, a relaxing massage, and perfect polish.
- Pedicure with Whitening Pack: $1,500 (90 min) - Unveil brighter feet with our signature Pedicure with Whitening Pack, targeting tan and discoloration for visibly softer, revitalized skin.

HAIR SERVICES:
- Women Hair Cut: $800 (60 min) - Transform your look with a bespoke Women's Hair Cut from our master stylists, crafted to perfectly complement your features and lifestyle.
- Men Hair Cut: $500 (45 min) - Experience modern barbering with our expert Men's Hair Cut, delivering a sharp, tailored cut that includes a relaxing wash and professional styling.
- Hair Wash: $300 (30 min) - Indulge in the luxury of a professional Hair Wash using premium organic products, combined with a relaxing scalp massage for a moment of bliss.
- Hair Wash & Style: $700 (60 min) - Perfect for any occasion, our Hair Wash & Style service leaves you with a salon-perfect blowout or style of your choice.
- Hair Perming: $2,500 starting (180 min) - Create lasting texture, from soft waves to bouncy curls, with our expert Hair Perming services, using advanced, gentle formulas.
- Hair Straightening: $3,000 starting (240 min) - Achieve sleek, frizz-free hair with our professional Hair Straightening treatments, including keratin smoothing for a smooth, glossy mane.
- Hair Colouring: $3,500 starting (180 min) - Express your style with our bespoke Hair Colouring services, using premium, low-ammonia products for stunning, luminous results.
- Hair Highlight: $4,000 starting (240 min) - Illuminate your hair with our professional Hair Highlighting services, mastering techniques like balayage and foiling for a natural or bold look.
- Hair Extension: $1,499 starting (120 min) - Instantly add luxurious length and volume with our premium, 100% human Hair Extensions, expertly applied for a seamless, natural blend.
- Hair Spa: $1,500 starting (90 min) - Revive your hair with our signature Hair Spa treatment, an intensive conditioning ritual that repairs damage and restores moisture for incredible softness and shine.
- Keratin Treatment: $3,000 starting (240 min) - Tame frizz for months with our transformative Keratin Treatment, which infuses your hair with protein for a sleek, glossy finish.

Recent Appointments Context (for reference when clients ask about existing bookings):
${recentAppointments.map(apt => `- ${apt.client_name} (${apt.email}, ${apt.phone}): ${apt.service} on ${apt.preferred_date} at ${apt.preferred_time} - Status: ${apt.status}`).join('\n')}

Your capabilities:
1. Help clients choose the right service based on their needs
2. Provide detailed information about treatments, benefits, and pricing
3. Guide clients through booking process (explain they'll need to use the booking form for final confirmation)
4. Help clients find their existing appointments using email or phone number
5. Answer questions about organic treatments, spa policies, and wellness advice
6. Provide directions and contact information
7. Explain the benefits of organic vs chemical treatments
8. Recommend service combinations for optimal results
9. Discuss aftercare and maintenance for treatments

Special Features:
- We use only organic, chemical-free products
- State-of-the-art equipment including advanced laser technology
- Highly skilled professionals with years of expertise
- Luxury ambiance in a tranquil environment
- Special packages available for multiple services

Guidelines:
- Always be warm, professional, and spa-like in tone
- Use emojis sparingly but effectively (✨, 🌿, 💆‍♀️, etc.)
- If someone wants to book, guide them step-by-step but explain they'll need to use the booking form for final confirmation
- For existing appointment queries, search by email or phone number in the recent appointments
- Provide accurate pricing and service information
- Promote the spa's organic, chemical-free philosophy
- If you can't find specific information, suggest they call +63 964 857 0967
- Always mention that we're located in Metro Manila when relevant
- Suggest service combinations when appropriate (e.g., Hair Spa + Hair Cut, Manicure + Pedicure)
- Explain the benefits of regular treatments for best results

Current date: ${new Date().toISOString().split('T')[0]}
Current time: ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Metro Manila' })}

Remember: You represent a luxury spa brand, so maintain that premium, caring, and knowledgeable tone throughout all interactions.`;
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const systemPrompt = await getSystemPrompt();
      
      const response = await InvokeLLM({
        prompt: `${systemPrompt}

User message: ${inputText}

Please respond as EasyGo Spa, the AI assistant for EasyGo Spa. Be helpful, friendly, professional, and provide accurate information about services, appointments, and spa-related topics. Format your response nicely with line breaks where appropriate for better readability.`,
        add_context_from_internet: false
      });

      const botMessage = {
        id: Date.now() + 1,
        text: response,
        sender: "bot",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I apologize, but I'm experiencing technical difficulties. Please call us directly at +63 964 857 0967 or visit our contact page for assistance. Our team will be happy to help you! ✨",
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 bg-gradient-to-r from-[#2db83d] to-[#45f248] text-white rounded-full shadow-2xl z-40 flex items-center justify-center transition-all duration-300 ${isOpen ? 'scale-0' : 'scale-100'} w-16 h-16`}
        aria-label="Open AI chat assistant"
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-4 right-4 w-[calc(100%-2rem)] max-w-sm h-[75vh] sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] bg-white rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-[#2db83d]/20"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2db83d] to-[#45f248] text-white p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center relative">
                  <Bot className="w-5 h-5" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold">EasyGo Spa AI</h3>
                  <p className="text-xs opacity-90">EasyGo Spa Assistant • Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[85%]`}>
                    {message.sender === 'bot' && (
                      <div className="w-8 h-8 rounded-full bg-[#45f248] flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={`p-3 rounded-2xl ${message.sender === 'user' ? 'bg-[#2db83d] text-white ml-2' : 'bg-gray-100 text-gray-800'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
                      <p className={`text-xs mt-1 text-right ${message.sender === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-[#2db83d] flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#45f248] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-2 mb-2 overflow-x-auto">
                <button
                  onClick={() => setInputText("I want to book an appointment")}
                  className="px-3 py-1 bg-[#2db83d] text-white text-xs rounded-full whitespace-nowrap hover:bg-[#45f248] transition-colors"
                >
                  📅 Book Now
                </button>
                <button
                  onClick={() => setInputText("Show me your services and prices")}
                  className="px-3 py-1 bg-[#2db83d] text-white text-xs rounded-full whitespace-nowrap hover:bg-[#45f248] transition-colors"
                >
                  💰 Prices
                </button>
                <button
                  onClick={() => setInputText("Where are you located?")}
                  className="px-3 py-1 bg-[#2db83d] text-white text-xs rounded-full whitespace-nowrap hover:bg-[#45f248] transition-colors"
                >
                  📍 Location
                </button>
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about services, booking, prices..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-[#2db83d] transition-colors"
                  disabled={isTyping}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isTyping}
                  className="w-10 h-10 bg-gradient-to-r from-[#2db83d] to-[#45f248] text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
