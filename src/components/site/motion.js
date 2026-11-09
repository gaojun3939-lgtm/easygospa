// 模版的出场动效：滑到才从下面浮上来，只播一次
export const rise = (delay = 0, y = 40) => ({
  initial: { opacity: 0, y },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: 'easeOut' },
  viewport: { once: true, margin: '0px 0px -60px 0px' },
})

export const openBooking = () => window.dispatchEvent(new CustomEvent('open-booking-modal'))
