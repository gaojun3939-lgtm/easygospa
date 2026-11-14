'use client'

import { useLocale } from 'next-intl'
import { nums } from './nums'

// 两行大标题的后半句（模版：第一行黑、第二行绿，中间换行）。
// 手机上（11-15「像我们 App」）两半接成一行，中间放什么按语言定（eg-sep，电脑上不显示，电脑上照旧换行）：
//   中文：前半句以英文结尾接空格（「Metro Manila 上门按摩服务」），否则接「，」（「简单透明，每次预约都一样」）
//   日文：接「、」；前半句以「の」结尾不加（「Metro Manilaの訪問マッサージ」）
//   英文、越南文：后半句大写开头接「 — 」（「Why Choose EasyGoSpa — Home Massage Service」），否则空格
//   韩文、泰文：空格
//   前半句本身带标点（「高端上门按摩，」）、或是被拆开的一句问句（「今天，您的身体 / 需要什么？」）：中日不加，别的语言空格
const PUNCT = /[，、。？！：；,.:;?!]$/
const CJK = /^[　-鿿豈-﫿]/

export function titleSep(locale, t1, t2) {
  const a = String(t1 || '').trim()
  const b = String(t2 || '').trim()
  const cjk = locale.startsWith('zh') || locale === 'ja'
  const splitQuestion = /[?？]$/.test(b) && !PUNCT.test(a)
  if (PUNCT.test(a) || splitQuestion) return cjk ? '' : ' '
  if (locale.startsWith('zh')) return /[A-Za-z0-9]$/.test(a) && CJK.test(b) ? ' ' : '，'
  if (locale === 'ja') return /の$/.test(a) ? '' : '、'
  if (locale === 'en' || locale === 'vi') return /^[A-ZÀ-Ỹ]/.test(b) ? ' — ' : ' '
  return ' '
}

export default function TitleTail({ t1, t2, className = '' }) {
  const locale = useLocale()
  return (
    <>
      <br className="eg-br" />
      <span className="eg-sep">{titleSep(locale, t1, t2)}</span>
      <span className={`eg-t2 ${className}`}>{nums(t2)}</span>
    </>
  )
}
