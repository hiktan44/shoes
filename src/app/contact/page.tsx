import { LegalPage } from '../_components/LegalPage';

export default function ContactPage() {
  return <LegalPage titleKey="contact.title">
    <p>Hesap, ödeme, veri talepleri ve teknik destek için bize e-posta ile ulaşabilirsiniz.</p>
    <p><a className="text-indigo-300 underline" href="mailto:info@stratejidanismanlik.com.tr">info@stratejidanismanlik.com.tr</a></p>
  </LegalPage>;
}
