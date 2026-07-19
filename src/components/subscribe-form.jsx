"use client"

import React from 'react'
import { Facebook } from 'lucide-react'
import { FACEBOOK_URL } from '@/lib/contactConfig'

// 老板 2026-07-19:订阅邮箱改为"关注脸书"——发促销/优惠直接发 FB,零成本零维护,
// 比接邮件服务更适合(菲律宾客人重度用 Facebook)。
function SubscribeForm() {
  return (
    <a
      href={FACEBOOK_URL}
      target="_blank"
      rel="noreferrer"
      aria-label="Follow EasyGoSpa on Facebook"
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#2db83d] px-5 py-3 font-medium text-white transition-colors duration-300 hover:bg-[#45f248] focus:outline-none focus:ring-2 focus:ring-[#2db83d] focus:ring-offset-2 focus:ring-offset-[#0F0F0F] sm:w-auto"
    >
      <Facebook className="h-5 w-5" aria-hidden="true" />
      Follow us on Facebook
    </a>
  )
}

export default SubscribeForm
