# Kredi izin düzeltmesi

`secure_credit_function_permissions` geçişi, kredi ekleme ve düşme işlevlerini
PUBLIC, anon ve authenticated rollerine kapatır. İşlemler sunucunun service_role
kimliği veya veritabanı sahibi tarafından yapılır. Yeni üye profil triggerı korunur.

Eski geçişler değiştirilmemiştir. Mevcut veritabanında yeni geçiş uygulanmalıdır;
yalnız web uygulamasını yeniden dağıtmak veritabanı izinlerini değiştirmez.
Canlı uygulamaya bağlı doğru veritabanı ve geçiş geçmişi doğrulanmadan uygulanmamalıdır.

## Yerel doğrulama

`npm run test:credits`, gerçek PostgreSQL motorunun bellek içi PGlite sürümünde
0002–0004 geçişlerini ve düzeltmeyi uygular. Yetkisiz çağrıları, sunucu işlemlerini,
aynı ödemenin tekrarını, askıya alınmış hesabı ve yeni üye triggerını sınar.
Üretim Supabase bağlantısı veya gerçek kullanıcı bakiyesi kullanılmaz.

## Dağıtım kabulü

Doğru veritabanında aşağıdaki salt okunur kontrol false/false/true döndürmelidir:

```sql
select
  has_function_privilege('anon', 'public.add_credits(uuid,integer,numeric,text,text,text)', 'EXECUTE') as anon_izinli,
  has_function_privilege('authenticated', 'public.add_credits(uuid,integer,numeric,text,text,text)', 'EXECUTE') as kullanici_izinli,
  has_function_privilege('service_role', 'public.add_credits(uuid,integer,numeric,text,text,text)', 'EXECUTE') as sunucu_izinli;
```

Aynı kontrol `public.deduct_credits(uuid,integer,text)` için de yapılmalıdır.
Sonrasında bir test hesabında üretim, bakiye ve ödeme işleme doğrulanmalıdır.
Normal kullanıcıya kredi değiştirme izni geri verilerek hata giderilmemelidir.
