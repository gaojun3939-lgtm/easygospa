import { Newsreader, Noto_Serif_JP, Noto_Serif_KR, Noto_Serif_SC, Noto_Serif_TC, Noto_Serif_Thai } from 'next/font/google'

// 首屏大标题的字（11-11 老板拿 easygospa.ph 比：「字体 排列 你看看官网的」）：
// 英文、越南文跟 .ph 同一款细衬线 Newsreader 常规体；中文、日文、韩文、泰文配同一系列的宋体（思源宋体 / Noto Serif）。
// 中日韩泰的字体很大，网站按字切成很多小块，页面只下载标题里用到的那几块；不提前加载。
export const heroLatin = Newsreader({ subsets: ['latin', 'latin-ext', 'vietnamese'], weight: ['400'], display: 'swap', variable: '--font-hero-latin' })
// next/font 要求参数写成字面值，不能用展开，所以每个都写全
export const heroSC = Noto_Serif_SC({ weight: ['400'], display: 'swap', preload: false, variable: '--font-hero-sc' })
export const heroTC = Noto_Serif_TC({ weight: ['400'], display: 'swap', preload: false, variable: '--font-hero-tc' })
export const heroJP = Noto_Serif_JP({ weight: ['400'], display: 'swap', preload: false, variable: '--font-hero-jp' })
export const heroKR = Noto_Serif_KR({ weight: ['400'], display: 'swap', preload: false, variable: '--font-hero-kr' })
export const heroTH = Noto_Serif_Thai({ subsets: ['thai'], weight: ['400'], display: 'swap', preload: false, variable: '--font-hero-th' })

export const heroFontVars = [heroLatin, heroSC, heroTC, heroJP, heroKR, heroTH].map((f) => f.variable).join(' ')
