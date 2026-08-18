import { LegalPage } from '../_components/LegalPage';

export default function PrivacyPage() {
  return <LegalPage title="Gizlilik Politikası">
    <p>Hesap bilgileriniz, yüklediğiniz ürün görselleri ve üretim talimatları hizmeti sunmak, güvenliği sağlamak ve destek vermek için işlenir.</p>
    <p>Kimlik doğrulama ve veri saklama altyapısında Supabase; ödeme işlemlerinde Stripe; yapay zekâ üretiminde yapılandırılmış model sağlayıcıları kullanılabilir. Ödeme kartı verileri Fasheone Shoes sunucularında saklanmaz.</p>
    <p>Yüklemeleriniz yalnızca talep ettiğiniz çıktıyı üretmek amacıyla yetkili sağlayıcılara aktarılır. Yasal zorunluluk dışında kişisel veriler satılmaz.</p>
    <p>Erişim, düzeltme veya silme talebi için <a className="text-indigo-300 underline" href="mailto:info@fasheone.com">info@fasheone.com</a> adresine yazabilirsiniz.</p>
  </LegalPage>;
}
