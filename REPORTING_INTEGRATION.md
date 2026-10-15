# Abone raporu kaynak entegrasyonu

Shoes Fasheone: endpoint hazır.

İş modeli: Tek seferlik kredi paketi. Canlı ücretli sayı, aktif/yeni/toplam abonelik ve kullanım metrikleri doğrulanmadı; bu alanlar null kalır.

Mevcut Supabase getUser + ADMIN_EMAILS veya profiles.is_admin

Uç: `/api/admin/subscriber-summary`, saat dilimli start/end, en çok31gün, [start,end), Europe/Istanbul, private/no-store. Test: Gerçek getAdminUser+route, sahte Supabase/PG; tsc.

Bu uygulamaya ait mevcut otomatik rapor credential/oturum doğrulanmadı. İlk7 anahtar uygulanamaz; yeni credential varsa işlem anında ayrı onay gerekir. Üretime yayın ve yeni güvenlik izni yok. Mevcut7 uygulamanın rapor anahtarları burada kullanılmaz. Kaynak yamasının varlığı canlı sayacın çalıştığı anlamına gelmez.

Yeni kalıcı erişim gerekirse önerilen ayrı işlem: yalnız bu uygulamada aggregate-report-read, yalnız bu aggregate GET/dönem sayaçları, hesap satırı/PII/CRUD/diğer uygulama/DB erişimi yok;7günlük pilot süre, anahtar sohbet dışında mevcut güvenli yapılandırmada saklanır. Bu bir tasarım/onay önerisidir; rol/token oluşturulmadı veya uygulanmadı. Platform böyle dar yetki desteklemiyorsa kontrollü dönem aggregate export’u kullanılır.
