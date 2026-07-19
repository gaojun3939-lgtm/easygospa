// EasyGoSpa 官网联系信息中央配置(老板 2026-07-19 更新)。所有电话/社媒/邮箱都从这里取,
// 改一处全站生效。WhatsApp 一键联系 + 联系表单/订阅改走 WhatsApp(无需邮件服务即刻送达)。
export const COMPANY_PHONE = '+63 964 857 0967';
export const WHATSAPP_NUMBER = '639648570967'; // wa.me 用的纯数字(去空格去+号)
export const FACEBOOK_URL = 'https://web.facebook.com/easygospa';
export const INSTAGRAM_URL = 'https://www.instagram.com/easygospa_services';
export const CONTACT_EMAIL = 'easygospa@gmail.com';

export function whatsappLink(text = '') {
  return `https://wa.me/${WHATSAPP_NUMBER}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
