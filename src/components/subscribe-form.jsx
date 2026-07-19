"use client"

import React, { useState } from 'react'
import { whatsappLink } from '@/lib/contactConfig'

// 老板 2026-07-19:订阅原来是空的(只挡了刷新)。改为一键发到 EasyGoSpa WhatsApp
// (无需邮件服务即刻送达),并给出成功提示。
function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    const value = email.trim()
    if (!value) return
    window.open(whatsappLink(`Hi EasyGoSpa, please add me to your offers and promotions. Email: ${value}`), '_blank', 'noopener')
    setDone(true)
    setEmail('')
  }

  return (
    <div>
      <form
        className="flex flex-col sm:flex-row gap-2 max-w-sm mx-auto md:max-w-none"
        aria-label="Newsletter subscription"
        onSubmit={handleSubmit}
      >
        <label htmlFor="newsletter-email" className="sr-only">Email address</label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="flex-1 px-4 py-2 bg-white/10 border border-[#2db83d]/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#2db83d] focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]"
          required
        />
        <button
          type="submit"
          className="px-4 py-2 bg-[#2db83d] text-white rounded-lg hover:bg-[#45f248] transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F]"
        >
          Subscribe
        </button>
      </form>
      {done ? <p className="mt-2 text-center text-xs font-medium text-[#45f248] md:text-left">Thanks! Send the WhatsApp message to confirm your subscription.</p> : null}
    </div>
  )
}

export default SubscribeForm
