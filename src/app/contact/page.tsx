import { LegalPage } from '../_components/LegalPage';

export default function ContactPage() {
  return <LegalPage titleKey="contact.title">
    <p>Hesap, ödeme, veri talepleri ve teknik destek için bize e-posta ile ulaşabilirsiniz.</p>
    <p><a className="text-indigo-300 underline" href="mailto:info@fasheone.com">info@fasheone.com</a></p>
    <p>TEXMART LTD · 284 Chase Road, A Block Unit, 2nd Floor, London, Birleşik Krallık</p>
  </LegalPage>;
}
