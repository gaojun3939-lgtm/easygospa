// 标题字体 Playfair 的数字是老式写法（0 像小写 o、4 和 7 往下掉），而且这套字体没有改成直排数字的开关。
// 标题和大字里的数字、₱ 一律包成 .ga-n（用正文的 Inter），字跟着语言走，数字在哪都能认出来。
export function nums(text) {
  return String(text ?? '').split(/(₱?\d[\d,.:/]*)/g).map((part, index) => (index % 2 ? <span key={index} className="ga-n">{part}</span> : part))
}
