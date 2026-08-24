import { type Lang } from './use-lang';

export type TranslationKey = keyof typeof DICT;

export const DICT = {
  // Landing Page
  'nav.home': { tr: 'Ana Sayfa', en: 'Home' },
  'nav.features': { tr: 'Özellikler', en: 'Features' },
  'nav.howItWorks': { tr: 'Nasıl çalışır', en: 'How it works' },
  'nav.pricing': { tr: 'Fiyatlandırma', en: 'Pricing' },
  'nav.faq': { tr: 'SSS', en: 'FAQ' },
  'nav.login': { tr: 'Giriş', en: 'Login' },
  'nav.contact': { tr: 'İletişim', en: 'Contact' },
  'nav.privacy': { tr: 'Gizlilik', en: 'Privacy' },
  'nav.terms': { tr: 'Şartlar', en: 'Terms' },
  'nav.cookies': { tr: 'Çerezler', en: 'Cookies' },
  'nav.and': { tr: 've', en: 'and' },

  // Hero Section
  'hero.tag': { tr: 'AYAKKABI MARKALARI İÇİN GÖRSEL STÜDYOSU', en: 'VISUAL STUDIO FOR SHOE BRANDS' },
  'hero.title': { tr: 'Ayakkabı fotoğrafçısına ödediğin parayı cebinde tut.', en: 'Keep the money you pay to shoe photographers in your pocket.' },
  'hero.description': { tr: 'Telefonla çektiğin tek bir kareyi; satışa hazır stüdyo görseline, modelin ayağında pozlara, sıfır tasarımlara ve e-ticaret metinlerine dönüştür. Dakikalar içinde, Türkçe, ürününe sadık.', en: 'Transform a single phone photo into sale-ready studio images, poses on models, new designs, and e-commerce texts. In minutes, in Turkish, faithful to your product.' },
  'hero.primaryButton': { tr: 'Ücretsiz Başla', en: 'Start Free' },
  'hero.secondaryButton': { tr: 'Fiyatları gör', en: 'View Pricing' },
  'hero.freeCredits': { tr: 'Kayıt olunca 10 ücretsiz kredi · Kart gerekmez · Abonelik yok', en: '10 free credits upon signup · No card required · No subscription' },
  'hero.avgTime': { tr: 'ortalama üretim süresi', en: 'average production time' },
  'hero.trust1': { tr: 'Pazaryeri uyumlu çıktı', en: 'Marketplace compatible output' },
  'hero.trust2': { tr: 'Ürüne %100 sadakat', en: '100% product fidelity' },
  'hero.trust3': { tr: 'Türkçe arayüz', en: 'Turkish interface' },
  'hero.trust4': { tr: 'Çoklu poz & model', en: 'Multiple poses & models' },
  'hero.trust5': { tr: 'Hazır SEO metni', en: 'Ready SEO text' },

  // Features
  'feature.studio.title': { tr: 'Telefonla çektiğin kareyi, satışa hazır stüdyo fotoğrafına çevir', en: 'Turn phone photos into sale-ready studio shots' },
  'feature.studio.body': { tr: 'Atölyede ya da rafta çekilmiş sıradan bir fotoğraf yeter. Saf beyaz fon, doğru ışık, gölge ve perspektif saniyeler içinde otomatik kuruluyor. Tabanın deseni, dikişler, logo ve toka birebir korunuyor — ürün "başka bir ayakkabı"ya dönüşmüyor.', en: 'An ordinary photo taken in the workshop or on the shelf is enough. Pure white background, correct lighting, shadow and perspective are set up automatically in seconds. The tread pattern, stitches, logo and buckle are preserved exactly — the product does not turn into "another shoe".' },
  'feature.studio.p1': { tr: 'Pazaryeri uyumlu 1:1 beyaz fon', en: 'Marketplace compatible 1:1 white background' },
  'feature.studio.p2': { tr: 'Tek tekten çift (sağ–sol) otomatik tamamlama', en: 'Automatic single-to-pair (left-right) completion' },
  'feature.studio.p3': { tr: 'Form & taban kilidi ile %100 sadakat', en: '100% fidelity with form & sole lock' },

  'feature.design.title': { tr: 'Çizimden, dokudan ve tabandan sıfır model üret', en: 'Create zero models from drawings, textures and soles' },
  'feature.design.body': { tr: 'Eskiz, deri/kumaş örneği, taban fotoğrafı ve toka referanslarını birlikte yükle; yapay zeka bunları tutarlı tek bir tasarımda birleştirsin. "Kalın kauçuk taban + yılan derisi saya" gibi fikirleri dakikalar içinde görselleştir.', en: 'Upload sketch, leather/fabric sample, sole photo and buckle references together; let AI combine them into a single consistent design. Visualize ideas like "thick rubber sole + snake skin upper" in minutes.' },
  'feature.design.p1': { tr: 'Eskiz + materyal + taban kompozisyonu', en: 'Sketch + material + sole composition' },
  'feature.design.p2': { tr: 'Referans bazlı doku/renk aktarımı', en: 'Reference-based texture/color transfer' },
  'feature.design.p3': { tr: 'Koleksiyon öncesi hızlı prototip', en: 'Quick prototype before collection' },

  'feature.pose.title': { tr: 'Aynı model, aynı kıyafet — 8 farklı poz tek tıkla', en: 'Same model, same outfit — 8 different poses with one click' },
  'feature.pose.body': { tr: 'Koltukta oturan, sokakta yürüyen, stüdyoda ayakta… İstediğin pozları seç, hepsi aynı mankenle ve aynı kıyafetle üretilsin. Yüz görünen / belden aşağı seçenekleriyle e-ticaret ve sosyal medya için tutarlı bir set elde et.', en: 'Sitting in a chair, walking on the street, standing in the studio... Choose the poses you want, all produced with the same model and same outfit. Get a consistent set for e-commerce and social media with face-visible / waist-down options.' },
  'feature.pose.p1': { tr: '8 hazır poz, çoklu seçim', en: '8 ready poses, multiple selection' },
  'feature.pose.p2': { tr: 'Karakter & kıyafet sabitleme', en: 'Character & outfit lock' },
  'feature.pose.p3': { tr: 'Tümünü ZIP indir veya albüm yap', en: 'Download all as ZIP or make album' },

  'feature.retouch.title': { tr: 'Fırçayla bölge seç, sadece orayı değiştir', en: 'Brush-select area, change only that part' },
  'feature.retouch.body': { tr: 'Görselin üstünde değişmesini istediğin yeri boya; bağcığı kırmızıya çevir, tabanı kalınlaştır, tokayı altın yap. Maske + talimat + referans görsel birlikte çalışır; gerisi piksel piksel aynı kalır. Geri/İleri ile adımları gez.', en: 'Paint over the part you want to change on the image; turn the laces red, thicken the sole, make the buckle gold. Mask + instruction + reference visual work together; the rest stays exactly the same pixel by pixel. Navigate steps with Back/Forward.' },
  'feature.retouch.p1': { tr: 'Canvas üzerinde maske fırçası', en: 'Mask brush on canvas' },
  'feature.retouch.p2': { tr: 'Renk / talimat / referans kombinasyonu', en: 'Color / instruction / reference combination' },
  'feature.retouch.p3': { tr: 'Çok adımlı geri-al / yinele', en: 'Multi-step undo / redo' },

  'feature.analyze.title': { tr: 'Ürün açıklaması, SEO ve özellikler — kopyala yapıştır hazır', en: 'Product description, SEO and features — copy-paste ready' },
  'feature.analyze.body': { tr: 'Ayakkabının fotoğrafını yükle; malzeme, stil, hedef kitle, bakım önerileri, SEO anahtar kelimeleri, kısa ve uzun pazarlama metni ve doğrudan sitene yapıştırılabilir HTML bloğu çıksın. Çoklu model yedeklemesiyle her zaman sonuç alırsın.', en: 'Upload the photo of the shoe; get material, style, target audience, care recommendations, SEO keywords, short and long marketing copy, and HTML block ready to paste directly to your site. With multi-model fallback, you always get results.' },
  'feature.analyze.p1': { tr: 'Derin görsel analiz + Türkçe metin', en: 'Deep visual analysis + Turkish text' },
  'feature.analyze.p2': { tr: 'SEO anahtar kelime seti', en: 'SEO keyword set' },
  'feature.analyze.p3': { tr: 'Hazır HTML açıklama bloğu', en: 'Ready HTML description block' },

  'feature.batch.title': { tr: 'Onlarca ürünü tek seferde işle', en: 'Process dozens of products at once' },
  'feature.batch.body': { tr: 'Sezon kataloğunu mu hazırlıyorsun? 30\'a kadar ayakkabıyı yükle, hepsine farklı poz, arka plan ve model varyasyonlarını toplu uygula. Tek tek uğraşma; sonuçları topluca indir.', en: 'Preparing the season catalog? Upload up to 30 shoes, apply different pose, background and model variations to all of them in bulk. Don\'t deal with them one by one; download results in bulk.' },
  'feature.batch.p1': { tr: 'Toplu yükleme & üretim', en: 'Bulk upload & production' },
  'feature.batch.p2': { tr: 'Varyasyonlu çıktı (poz/fon/model)', en: 'Variation output (pose/background/model)' },
  'feature.batch.p3': { tr: 'Tek tıkla toplu indirme', en: 'One-click bulk download' },

  // Mini Features
  'mini.album': { tr: 'Albüm & Kolaj', en: 'Album & Collage' },
  'mini.albumDesc': { tr: 'Üretilen pozlardan editoryal magazin düzeninde tek kare oluştur.', en: 'Create single frame in editorial magazine layout from generated poses.' },
  'mini.credits': { tr: 'Kredi Sistemi', en: 'Credit System' },
  'mini.creditsDesc': { tr: 'Abonelik yok; kullandığın kadar öde, krediler hiç bitmez.', en: 'No subscription; pay as you use, credits never expire.' },
  'mini.turkish': { tr: 'Tamamen Türkçe', en: 'Fully Turkish' },
  'mini.turkishDesc': { tr: 'Arayüz, üretim yönlendirmeleri ve metinler Türkçe.', en: 'Interface, production prompts and texts are in Turkish.' },
  'mini.secure': { tr: 'Güvenli Hesap', en: 'Secure Account' },
  'mini.secureDesc': { tr: 'E-posta veya Google ile giriş, verilerin sana özel.', en: 'Login with email or Google, your data is private to you.' },
  'mini.resolution': { tr: 'Yüksek Çözünürlük', en: 'High Resolution' },
  'mini.resolutionDesc': { tr: 'Pazaryeri ve baskı için keskin, net çıktılar.', en: 'Sharp, clear outputs for marketplaces and print.' },
  'mini.free': { tr: '10 Ücretsiz Kredi', en: '10 Free Credits' },
  'mini.freeDesc': { tr: 'Kayıt olunca hemen denemeye başla, kart gerekmez.', en: 'Start trying immediately upon signup, no card required.' },

  // How it works
  'how.title': { tr: 'NASIL ÇALIŞIR', en: 'HOW IT WORKS' },
  'how.subtitle': { tr: 'Üç adımda satışa hazır', en: 'Ready to sell in three steps' },
  'how.step1.title': { tr: 'Görseli yükle', en: 'Upload image' },
  'how.step1.desc': { tr: 'Telefonla çekilmiş bir fotoğraf ya da eskiz yeterli.', en: 'A photo taken with a phone or a sketch is sufficient.' },
  'how.step2.title': { tr: 'Senaryoyu seç', en: 'Select scenario' },
  'how.step2.desc': { tr: 'Stüdyo, poz, rötuş veya tasarım — ne istediğini söyle.', en: 'Studio, pose, retouch or design — tell what you want.' },
  'how.step3.title': { tr: 'Saniyeler içinde indir', en: 'Download in seconds' },
  'how.step3.desc': { tr: 'Satışa hazır görsel ve metinleri al, sitene koy.', en: 'Get sale-ready visuals and texts, put them on your site.' },

  // Pricing
  'pricing.title': { tr: 'Sadece kullandığın kadar öde', en: 'Pay only for what you use' },
  'pricing.description': { tr: 'Abonelik yok. Kredi al, harca, krediler süresiz geçerli. İhtiyacın büyürse Kurumsal\'a geç.', en: 'No subscription. Buy credits, spend them, credits valid indefinitely. When your needs grow, switch to Enterprise.' },
  'pricing.viewAll': { tr: 'Tüm planları gör →', en: 'View all plans →' },
  'pricing.plans.basic': { tr: 'Başlangıç', en: 'Starter' },
  'pricing.plans.standard': { tr: 'Standart', en: 'Standard' },
  'pricing.plans.pro': { tr: 'Profesyonel', en: 'Professional' },
  'pricing.popular': { tr: 'EN ÇOK TERCİH EDİLEN', en: 'MOST PREFERRED' },

  // FAQ
  'faq.title': { tr: 'Aklındaki sorular', en: 'Questions in your mind' },
  'faq.q1': { tr: 'Ayakkabının orijinal detayları korunuyor mu?', en: 'Are the original details of the shoe preserved?' },
  'faq.a1': { tr: 'Evet. Form, taban yüksekliği, dikiş, logo ve aksesuarlar için ayrı koruma kuralları uygulanır; ürün başka bir modele dönüşmez.', en: 'Yes. Separate protection rules are applied for form, sole height, stitches, logo and accessories; the product does not turn into another model.' },
  'faq.q2': { tr: 'Tek ayakkabı fotoğrafından çift üretebiliyor mu?', en: 'Can it produce a pair from a single shoe photo?' },
  'faq.a2': { tr: 'Evet, referansta tek tek varsa simetrik eşlenmiş sağ-sol çift otomatik oluşturulur.', en: 'Yes, if there is a single one in the reference, a symmetrically paired left-right pair is automatically created.' },
  'faq.q3': { tr: 'Abonelik zorunlu mu?', en: 'Is subscription mandatory?' },
  'faq.a3': { tr: 'Hayır. Kredi paketi alırsın, kullandıkça düşer ve krediler süresiz geçerlidir. Yeni üyelere 10 ücretsiz kredi verilir.', en: 'No. You buy a credit package, it decreases as you use, and credits are valid indefinitely. New members are given 10 free credits.' },
  'faq.q4': { tr: 'Sonuçları nerede kullanabilirim?', en: 'Where can I use the results?' },
  'faq.a4': { tr: 'Trendyol, Hepsiburada gibi pazaryerleri, kendi e-ticaret siten, Instagram ve kataloglar için optimize çıktılar üretir.', en: 'It produces optimized outputs for marketplaces like Trendyol, Hepsiburada, your own e-commerce site, Instagram and catalogs.' },

  // CTA
  'cta.title': { tr: 'Bugün ilk görselini ücretsiz üret', en: 'Produce your first visual for free today' },
  'cta.description': { tr: 'Kayıt ol, 10 kredini al, telefonundaki ayakkabı fotoğrafını profesyonel bir vitrine çevir.', en: 'Sign up, get your 10 credits, turn the shoe photo on your phone into a professional display.' },

  // Auth
  'auth.signIn': { tr: 'Giriş Yap', en: 'Sign In' },
  'auth.signUp': { tr: 'Hesap Oluştur', en: 'Create Account' },
  'auth.googleButton': { tr: 'Google ile Giriş Yap', en: 'Sign in with Google' },
  'auth.googleButtonUp': { tr: 'Google ile Devam Et', en: 'Continue with Google' },
  'auth.orEmail': { tr: 'veya e-posta ile', en: 'or with email' },
  'auth.email': { tr: 'E-posta', en: 'Email' },
  'auth.password': { tr: 'Şifre', en: 'Password' },
  'auth.passwordHelp': { tr: 'En az 6 karakter.', en: 'At least 6 characters.' },
  'auth.legalAgree': { tr: 'Kullanım Şartları ve Gizlilik Politikası\'nı okudum ve kabul ediyorum.', en: 'I have read and accept the Terms of Service and Privacy Policy.' },
  'auth.loading': { tr: 'Bekleyin…', en: 'Please wait…' },
  'auth.signInUp': { tr: 'Hesabın yok mu? Kayıt ol', en: 'Don\'t have an account? Sign up' },
  'auth.upIn': { tr: 'Zaten hesabın var mı? Giriş yap', en: 'Already have an account? Sign in' },
  'auth.note': { tr: 'Fasheone Shoes ayrı bir ürün hesabı kullanır; fasheone.com hesabınız burada otomatik olarak ortak değildir.', en: 'Fasheone Shoes uses a separate product account; your fasheone.com account is not automatically shared here.' },
  'auth.nextPage': { tr: 'Girişten sonra', en: 'After login' },
  'auth.page': { tr: 'sayfasına döneceksiniz.', en: 'you will return to the page.' },

  // App Navigation
  'app.studio': { tr: 'Stüdyo', en: 'Studio' },
  'app.analyze': { tr: 'Ürün Analizi', en: 'Product Analysis' },
  'app.batch': { tr: 'Toplu Üretim', en: 'Batch Production' },
  'app.credits': { tr: 'kredi', en: 'credits' },
  'app.creditsLoad': { tr: '· Yükle', en: '· Load' },
  'app.admin': { tr: 'Admin', en: 'Admin' },
  'app.logout': { tr: 'Çıkış', en: 'Logout' },

  // Studio
  'studio.tab.photo': { tr: 'Fotoğraf', en: 'Photo' },
  'studio.tab.design': { tr: 'AI Tasarım', en: 'AI Design' },
  'studio.tab.retouch': { tr: 'Rötuş', en: 'Retouch' },
  'studio.hint': { tr: '3 adımda başla: 1) Sol panelden ayakkabı fotoğrafını yükle · 2) Senaryo/poz seç · 3) Üret butonuna bas. Her üretimin kredi maliyeti butonda yazar; sekmeyi kapatsan bile sonuç korunur.', en: 'Get started in 3 steps: 1) Upload shoe photo from left panel · 2) Select pose/scenario · 3) Press production button. Credit cost of each production is written on the button; result is preserved even if you close the tab.' },
  'studio.retouch.source': { tr: 'Kaynak Görsel', en: 'Source Image' },
  'studio.retouch.clear': { tr: 'Temizle', en: 'Clear' },
  'studio.retouch.change': { tr: 'Görseli Değiştir', en: 'Change Image' },
  'studio.retouch.load': { tr: 'Görsel Yükle', en: 'Load Image' },
  'studio.retouch.dragDrop': { tr: 'Sürükle-bırak veya tıkla', en: 'Drag-drop or click' },
  'studio.retouch.ref': { tr: 'Değiştirilecek / Eklenecek Görsel', en: 'Image to Replace / Add' },
  'studio.retouch.refDesc': { tr: 'Bu görseldeki materyal/renk/desen, kaynak ayakkabıda işaretli bölgeye uygulanır.', en: 'The material/color/pattern in this image is applied to the marked area on the source shoe.' },
  'studio.retouch.optional': { tr: 'opsiyonel', en: 'optional' },
  'studio.retouch.reload': { tr: 'Yeniden Yükle', en: 'Reload' },
  'studio.retouch.select': { tr: 'Görsel Seç', en: 'Select Image' },
  'studio.retouch.region': { tr: 'Hedef Bölge', en: 'Target Region' },
  'studio.retouch.color': { tr: 'Renk', en: 'Color' },
  'studio.retouch.instruction': { tr: 'Talimat', en: 'Instruction' },
  'studio.retouch.instructionPlaceholder': { tr: 'Örn: bağcıkları kırmızıya çevir, tabanı daha kalın yap, toka altın renge dönsün...', en: 'E.g: turn laces red, make sole thicker, make buckle gold colored...' },
  'studio.upload.title': { tr: 'Referans Görsel', en: 'Reference Image' },
  'studio.upload.load': { tr: 'Görsel Yükle', en: 'Load Image' },
  'studio.scenario': { tr: 'Çekim Senaryosu (Atmosfer)', en: 'Shooting Scenario (Atmosphere)' },
  'studio.poseInfo': { tr: 'Aktif:', en: 'Active:' },
  'studio.poseInfoDetail': { tr: 'Tek tekli ayakkabı yüklendiğinde otomatik olarak doğru aynalanmış L+R çift üretilir. Ayakkabıda sıfır değişiklik garantisi ve 30+ yıllık ayakkabı ustası persona\'sı tüm promptlara enjekte edilir.', en: 'When a single shoe is uploaded, a correctly mirrored L+R pair is automatically produced. Zero change guarantee on the shoe and 30+ year shoe craftsman persona is injected into all prompts.' },
  'studio.design.style': { tr: 'Ayakkabı Modeli Stili', en: 'Shoe Model Style' },
  'studio.design.prompt': { tr: 'Tasarım Promptu', en: 'Design Prompt' },
  'studio.design.promptPlaceholder': { tr: 'Örn: Fütüristik neon çizgileri olan, kalın tabanlı deri sneaker tasarımı...', en: 'E.g: Leather sneaker design with thick sole and futuristic neon lines...' },
  'studio.design.sketch': { tr: 'Referans Çizim (Sketch)', en: 'Reference Sketch' },
  'studio.design.leather': { tr: 'Deri & Kumaş Doku', en: 'Leather & Fabric Texture' },
  'studio.design.accessory': { tr: 'Toka & Aksesuar', en: 'Buckle & Accessory' },
  'studio.design.sole': { tr: 'Taban / Sole', en: 'Sole' },
  'studio.design.soleDesc': { tr: '+ Taban deseni / yüksekliği / kauçuk dokusu', en: '+ Sole pattern / height / rubber texture' },
  'studio.design.secondary': { tr: 'İkinci Kaplama / Bağcık Rengi', en: 'Secondary Overlay / Laces Color' },
  'studio.design.secondaryDesc': { tr: '+ Panel veya Bağcık Referansı', en: '+ Panel or Laces Reference' },
  'studio.design.loadSketch': { tr: '+ Yükle', en: '+ Upload' },

  // Studio Empty States
  'studio.empty.photo': { tr: 'Satışa Hazır Görseller Üretin', en: 'Produce Sale-Ready Visuals' },
  'studio.empty.photoDesc': { tr: 'Amatör fotoğrafları profesyonel stüdyo ve yaşam tarzı e-ticaret karelerine dönüştürün.', en: 'Transform amateur photos into professional studio and lifestyle e-commerce shots.' },
  'studio.empty.design': { tr: 'Kendi Modelinizi Tasarlayın', en: 'Design Your Own Model' },
  'studio.empty.designDesc': { tr: 'Sınıfının en iyisi yapay zeka ile doku, renk ve çizim referanslarını kullanarak sıfırdan model tasarlayın.', en: 'Design models from scratch using world-class AI with texture, color and drawing references.' },
  'studio.empty.retouch': { tr: 'Hedefli Rötuş', en: 'Targeted Retouch' },
  'studio.empty.retouchDesc': { tr: 'Mevcut ayakkabıdaki tek bir bölgeyi (bağcık, taban, toka...) renk/talimat/referans ile değiştir, gerisi aynı kalsın.', en: 'Change a single region on an existing shoe (laces, sole, buckle...) with color/instruction/reference, keep the rest the same.' },

  // Studio Controls
  'studio.controls.preserve': { tr: 'Üstün Koruma Filtreleri', en: 'Super Protection Filters' },
  'studio.controls.form': { tr: 'Form ve Taban Kilitli', en: 'Form and Sole Locked' },
  'studio.controls.formDesc': { tr: 'Ayakkabı şeklinin ve yüksekliğinin bozulmasını önler.', en: 'Prevents deformation of shoe shape and height.' },
  'studio.controls.details': { tr: 'Detay ve Aksesuar Netliği', en: 'Detail and Accessory Clarity' },
  'studio.controls.detailsDesc': { tr: 'Toka, bağcık, dikiş gibi alanların korunmasını maksimize eder.', en: 'Maximizes protection of areas like buckle, laces, stitches.' },
  'studio.controls.sizes': { tr: 'Boyutlar', en: 'Sizes' },
  'studio.controls.size1': { tr: '1:1 (E-Ticaret Standart)', en: '1:1 (E-Commerce Standard)' },
  'studio.controls.size2': { tr: '4:5 (Sosyal Medya)', en: '4:5 (Social Media)' },
  'studio.controls.size3': { tr: '16:9 (Kampanya Afişi)', en: '16:9 (Campaign Banner)' },
  'studio.controls.history': { tr: 'Son Üretimler', en: 'Recent Productions' },
  'studio.controls.delete': { tr: 'Sil', en: 'Delete' },

  // Studio Actions
  'studio.action.retouch': { tr: 'Rötuş Uygula (1 Kredi)', en: 'Apply Retouch (1 Credit)' },
  'studio.action.retouching': { tr: 'Rötuş Uygulanıyor...', en: 'Applying Retouch...' },
  'studio.action.producing': { tr: 'İşleniyor...', en: 'Processing...' },
  'studio.action.produce': { tr: 'Stüdyo Çekimi Üret', en: 'Produce Studio Shot' },
  'studio.action.design': { tr: 'Sıfırdan Tasarım Üret', en: 'Design from Scratch' },
  'studio.action.pose': { tr: 'Poz Üret', en: 'Produce Pose' },

  // Studio Loading
  'studio.loading.preparing': { tr: 'Hazırlanıyor…', en: 'Preparing…' },
  'studio.loading.resume': { tr: 'Yarım kalan üretim sürdürülüyor…', en: 'Resuming incomplete production…' },
  'studio.loading.studio': { tr: 'Stüdyo görseli hazırlanıyor…', en: 'Preparing studio visual…' },
  'studio.loading.design': { tr: 'Tasarım hazırlanıyor…', en: 'Preparing design…' },
  'studio.loading.vibe': { tr: 'Sahne / atmosfer uygulanıyor…', en: 'Applying scene/atmosphere…' },
  'studio.loading.poses': { tr: 'Pozlar üretiliyor', en: 'Producing poses' },
  'studio.loading.saving': { tr: 'Kaydediliyor…', en: 'Saving…' },
  'studio.loading.active': { tr: 'Üretim Motoru Aktif', en: 'Production Engine Active' },
  'studio.loading.note': { tr: 'Doku aslına uygun şekilde korunuyor, sekmeyi kapatsan bile sonuç korunur.', en: 'Texture is preserved faithfully to the original, result is preserved even if you close the tab.' },

  // Studio Zoom/Download
  'studio.zoom': { tr: 'Büyüt', en: 'Zoom' },
  'studio.download': { tr: 'İndir', en: 'Download' },
  'studio.continue': { tr: 'Bu Sonuçtan Devam', en: 'Continue From This Result' },
  'studio.step': { tr: 'Adım', en: 'Step' },
  'studio.back': { tr: 'Geri', en: 'Back' },
  'studio.forward': { tr: 'İleri', en: 'Forward' },
  'studio.zoomTip': { tr: '"Devam Et" → bu görselin üzerine yeni rötuş · "Geri/İleri" → adımlar arasında gezin · Resme tıkla → büyüt', en: '"Continue" → new retouch on this visual · "Back/Forward" → navigate between steps · Click image → zoom' },
  'studio.maskTip': { tr: 'Görselin üzerinde değişmesini istediğin alanı boyayın. Fırça boyutunu üstten ayarlayın. Maske olmadan da göndererek serbest düzenleme yapabilirsiniz.', en: 'Paint the area you want to change on the visual. Adjust brush size from top. You can also send without mask for free editing.' },
  'studio.brush': { tr: 'Fırça', en: 'Brush' },
  'studio.maskClear': { tr: 'Maskeyi Temizle', en: 'Clear Mask' },
  'studio.maskActive': { tr: '● Bölge işaretli', en: '● Region marked' },

  // Studio Multi Pose
  'studio.multi.ready': { tr: 'hazır', en: 'ready' },
  'studio.multi.download': { tr: 'Toplu İndir (ZIP)', en: 'Bulk Download (ZIP)' },
  'studio.multi.album': { tr: 'Albüm Oluştur', en: 'Create Album' },
  'studio.multi.downloadTip': { tr: 'Tüm başarılı sonuçları ZIP olarak indir', en: 'Download all successful results as ZIP' },
  'studio.multi.albumTip': { tr: 'Sonuçlardan editoryal albüm/kolaj oluştur', en: 'Create editorial album/collage from results' },
  'studio.multi.albumTag': { tr: '📓 ALBÜM', en: '📓 ALBUM' },
  'studio.multi.range': { tr: 'seçili aralık', en: 'selected range' },
  'studio.multi.days': { tr: 'son 30 gün', en: 'last 30 days' },
  'studio.multi.error': { tr: 'Hata', en: 'Error' },

  // Errors
  'error.insufficientCredits': { tr: 'Bu üretim {cost} kredi gerektiriyor, bakiyeniz {balance}. Lütfen kredi yükleyin.', en: 'This production requires {cost} credits, your balance is {balance}. Please load credits.' },
  'error.invalidResponse': { tr: 'Sunucu yanıtı geçersiz ({status}). Tekrar deneyin.', en: 'Invalid server response ({status}). Please try again.' },
  'error.requestFailed': { tr: 'İstek başarısız ({status})', en: 'Request failed ({status})' },
  'error.statusFailed': { tr: 'Status hatası', en: 'Status error' },
  'error.productionFailed': { tr: 'Üretim başarısız', en: 'Production failed' },
  'error.timeout': { tr: 'Üretim zaman aşımına uğradı', en: 'Production timed out' },
  'error.invalidUpload': { tr: 'Desteklenmeyen format: {type}', en: 'Unsupported format: {type}' },
  'error.tooLarge': { tr: 'Görsel çok büyük: {size} MB (max 8 MB)', en: 'Image too large: {size} MB (max 8 MB)' },
  'error.sourceRequired': { tr: 'Önce kaynak görsel seç (yükle veya son sonucu kullan)', en: 'First select source image (upload or use last result)' },
  'error.inputRequired': { tr: 'Talimat, renk veya referans görselden en az birini ver', en: 'Provide at least one of instruction, color or reference image' },
  'error.albumMin': { tr: 'Albüm için en az 2 başarılı poz gerekli', en: 'At least 2 successful poses required for album' },
  'error.albumFailed': { tr: 'Albüm başlatma hatası', en: 'Album initialization error' },
  'error.albumTimeout': { tr: 'Albüm zaman aşımına uğradı', en: 'Album timed out' },
  'error.bulkDownload': { tr: 'Toplu indirme hatası', en: 'Bulk download error' },
  'error.retouchStart': { tr: 'Rötuş başlatma hatası', en: 'Retouch start error' },
  'error.retouchFailed': { tr: 'Rötuş başarısız', en: 'Retouch failed' },
  'error.retouchTimeout': { tr: 'Rötuş zaman aşımına uğradı', en: 'Retouch timed out' },
  'error.retouchError': { tr: 'Rötuş hatası', en: 'Retouch error' },
  'error.buyCredits': { tr: 'Kredi Al →', en: 'Buy Credits →' },

  // Pricing Page
  'pricing.nav.balance': { tr: 'Bakiye:', en: 'Balance:' },
  'pricing.nav.back': { tr: '← Uygulamaya dön', en: '← Back to app' },
  'pricing.headline': { tr: 'Fiyatlandırma', en: 'Pricing' },
  'pricing.subheadline': { tr: 'İhtiyacınıza uygun kredi paketini seçin. Abonelik yok — sadece kullandığınız kadar ödersiniz. Krediler hiç bitmez.', en: 'Choose the credit package that suits your needs. No subscription — you only pay for what you use. Credits never expire.' },
  'pricing.newUser': { tr: 'Yeni üyeler 10 ücretsiz kredi ile başlar 🎁', en: 'New members start with 10 free credits 🎁' },
  'pricing.success': { tr: 'Ödeme başarılı! Krediler birkaç saniye içinde hesabınıza yüklenecek.', en: 'Payment successful! Credits will be loaded to your account in a few seconds.' },
  'pricing.canceled': { tr: 'Ödeme iptal edildi.', en: 'Payment cancelled.' },
  'pricing.credits': { tr: 'kredi', en: 'credits' },
  'pricing.perCredit': { tr: '₺ / kredi', en: '₺ / credit' },
  'pricing.buy': { tr: 'Satın Al', en: 'Buy' },
  'pricing.redirecting': { tr: 'Yönlendiriliyor…', en: 'Redirecting…' },
  'pricing.usageTitle': { tr: '💡 Kredi Kullanımı', en: '💡 Credit Usage' },
  'pricing.usageDesc': { tr: 'Her işlemin kredi maliyeti:', en: 'Credit cost of each transaction:' },
  'pricing.enterpriseTitle': { tr: 'Kurumsal Çözümler', en: 'Enterprise Solutions' },
  'pricing.enterpriseDesc': { tr: 'Büyük ekipler ve şirketler için özel kredi paketleri, sınırsız kullanıcı, öncelikli destek, özel hesap yöneticisi, API erişimi ve SLA garantisi.', en: 'Special credit packages for large teams and companies, unlimited users, priority support, dedicated account manager, API access and SLA guarantee.' },
  'pricing.enterpriseFeature1': { tr: '✓ Özel Kredi Paketi', en: '✓ Custom Credit Package' },
  'pricing.enterpriseFeature2': { tr: '✓ Sınırsız Kullanıcı', en: '✓ Unlimited Users' },
  'pricing.enterpriseFeature3': { tr: '✓ Öncelikli Destek & Özel Hesap Yöneticisi', en: '✓ Priority Support & Dedicated Account Manager' },
  'pricing.enterpriseFeature4': { tr: '✓ API Erişimi & Özel Entegrasyon', en: '✓ API Access & Custom Integration' },
  'pricing.enterpriseFeature5': { tr: '✓ SLA Garantisi', en: '✓ SLA Guarantee' },
  'pricing.enterpriseContact': { tr: 'İletişime Geç', en: 'Contact Us' },

  // Admin Page
  'admin.title': { tr: 'Fasheone Admin', en: 'Fasheone Admin' },
  'admin.back': { tr: '← Uygulama', en: '← App' },
  'admin.denied': { tr: 'Bu sayfaya erişim yetkiniz yok', en: 'You do not have access to this page' },
  'admin.deniedButton': { tr: 'Ana sayfaya dön', en: 'Return to homepage' },
  'admin.statUsers': { tr: 'Toplam Kullanıcı', en: 'Total Users' },
  'admin.statAdmins': { tr: 'Admin Kullanıcı', en: 'Admin Users' },
  'admin.statCredits': { tr: 'Toplam Kredi (bakiye)', en: 'Total Credits (balance)' },
  'admin.statGenerations': { tr: 'Toplam Üretim', en: 'Total Productions' },
  'admin.statRevenue': { tr: 'Toplam Gelir', en: 'Total Revenue' },
  'admin.statOrders': { tr: 'Sipariş', en: 'Orders' },
  'admin.statToday': { tr: 'bugün', en: 'today' },
  'admin.filterStart': { tr: 'Başlangıç', en: 'Start' },
  'admin.filterEnd': { tr: 'Bitiş', en: 'End' },
  'admin.filterApply': { tr: 'Uygula', en: 'Apply' },
  'admin.filterReset': { tr: 'Sıfırla', en: 'Reset' },
  'admin.exportUsers': { tr: '⬇ Kullanıcılar CSV', en: '⬇ Users CSV' },
  'admin.exportTransactions': { tr: '⬇ İşlemler CSV', en: '⬇ Transactions CSV' },
  'admin.chartRevenue': { tr: '💰 Günlük Gelir', en: '💰 Daily Revenue' },
  'admin.chartRevenueDesc': { tr: 'Tamamlanan satın almalar (₺)', en: 'Completed purchases (₺)' },
  'admin.chartProduction': { tr: '🎨 Günlük Üretim', en: '🎨 Daily Production' },
  'admin.chartProductionDesc': { tr: 'Oluşturulan görsel sayısı', en: 'Number of visuals created' },
  'admin.today': { tr: '(bugün)', en: '(today)' },
  'admin.usersTitle': { tr: 'Kullanıcılar', en: 'Users' },
  'admin.search': { tr: 'E-posta ara…', en: 'Search email…' },
  'admin.filterAllRoles': { tr: 'Tüm roller', en: 'All roles' },
  'admin.filterAdmin': { tr: 'Admin', en: 'Admin' },
  'admin.filterUser': { tr: 'Üye', en: 'Member' },
  'admin.filterAllStatuses': { tr: 'Tüm durumlar', en: 'All statuses' },
  'admin.filterActive': { tr: 'Aktif', en: 'Active' },
  'admin.filterSuspended': { tr: 'Askıda', en: 'Suspended' },
  'admin.sortNewest': { tr: 'En yeni kayıt', en: 'Newest registration' },
  'admin.sortOldest': { tr: 'En eski kayıt', en: 'Oldest registration' },
  'admin.sortCredits': { tr: 'En çok kredi', en: 'Most credits' },
  'admin.sortGenerations': { tr: 'En çok üretim', en: 'Most productions' },
  'admin.sortPaid': { tr: 'En çok ödeme', en: 'Most payment' },
  'admin.sortActivity': { tr: 'Son aktivite', en: 'Last activity' },
  'admin.filterButton': { tr: 'Filtrele', en: 'Filter' },
  'admin.tableUser': { tr: 'Kullanıcı', en: 'User' },
  'admin.tableCredits': { tr: 'Kredi', en: 'Credits' },
  'admin.tableProductions': { tr: 'Üretim', en: 'Productions' },
  'admin.tableToday': { tr: 'Bugün', en: 'Today' },
  'admin.tableSpent': { tr: 'Harcanan', en: 'Spent' },
  'admin.tablePayment': { tr: 'Ödeme', en: 'Payment' },
  'admin.tableActivity': { tr: 'Son Aktivite', en: 'Last Activity' },
  'admin.tableRegister': { tr: 'Kayıt', en: 'Register' },
  'admin.tableRole': { tr: 'Rol', en: 'Role' },
  'admin.tableAction': { tr: 'İşlem', en: 'Action' },
  'admin.tableMember': { tr: 'üye', en: 'member' },
  'admin.tableAdmin': { tr: 'ADMIN', en: 'ADMIN' },
  'admin.tableSuspended': { tr: 'ASKIDA', en: 'SUSPENDED' },
  'admin.loading': { tr: 'Yükleniyor…', en: 'Loading…' },
  'admin.noUsers': { tr: 'Kullanıcı yok', en: 'No users' },
  'admin.actionCredits': { tr: '± Kredi', en: '± Credits' },
  'admin.actionAdminMake': { tr: 'Admin yap', en: 'Make Admin' },
  'admin.actionAdminRemove': { tr: 'Admin kaldır', en: 'Remove Admin' },
  'admin.actionSuspend': { tr: 'Askıya al', en: 'Suspend' },
  'admin.actionActivate': { tr: 'Aktifleştir', en: 'Activate' },
  'admin.actionDelete': { tr: 'Sil', en: 'Delete' },
  'admin.transactionsTitle': { tr: 'Son İşlemler', en: 'Recent Transactions' },
  'admin.tableType': { tr: 'Tip', en: 'Type' },
  'admin.tableAmount': { tr: 'Tutar', en: 'Amount' },
  'admin.tableReason': { tr: 'Neden', en: 'Reason' },
  'admin.tableProvider': { tr: 'Sağlayıcı', en: 'Provider' },
  'admin.tableDate': { tr: 'Tarih', en: 'Date' },

  // Language Switcher
  'lang.switch': { tr: 'Dil', en: 'Language' },
  'lang.tr': { tr: 'TR', en: 'TR' },
  'lang.en': { tr: 'EN', en: 'EN' },
} as const;

export const t = (
  key: TranslationKey,
  lang: Lang,
  vars?: Record<string, string | number>
): string => {
  const entry = DICT[key];
  if (!entry) return key;

  const text = entry[lang] || entry.tr; // Fallback to Turkish

  if (!vars) return text;

  // Simple variable substitution
  return text.replace(/\{(\w+)\}/g, (_, varName) => {
    const val = vars[varName];
    return val !== undefined ? String(val) : `{${varName}}`;
  });
};

import { useLang as useLangHook } from './use-lang';

export const useT = () => {
  const { lang, setLang } = useLangHook();
  return {
    lang,
    setLang,
    t: (key: TranslationKey, vars?: Record<string, string | number>) => t(key, lang, vars),
  };
};
