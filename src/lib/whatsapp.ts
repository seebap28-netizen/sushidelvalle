export const WHATSAPP_PHONE = "56955119982";

export function whatsappHref(text: string) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}
