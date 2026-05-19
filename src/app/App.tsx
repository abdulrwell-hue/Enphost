import { Camera, Video, Instagram, MessageCircle, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

// Import images
import imgZV3A9167 from '../imports/ZV3A9167.jpg';
import imgZV3A9535 from '../imports/ZV3A9535.jpg';
import imgZV3A9477 from '../imports/ZV3A9477.jpg';
import imgZV3A9242 from '../imports/ZV3A9242.jpg';
import img5_1 from '../imports/5-1.jpg';
import img15 from '../imports/15.jpg';
import img20 from '../imports/20.jpg';
import img23 from '../imports/23.jpg';
import img46_1 from '../imports/46-1.jpg';
import img59_1 from '../imports/59-1.jpg';
import imgZV3A9180 from '../imports/ZV3A9180.jpg';
import imgZV3A9560 from '../imports/ZV3A9560.jpg';

// Import video
import videoSample from '../imports/VIDEO-2026-05-07-16-05-09.mp4';


export default function App() {
  const whatsappNumber = "966599991078"; // Saudi Arabia format
  const whatsappUrl = `https://wa.me/${whatsappNumber}`;
  const instagramUrl = "https://www.instagram.com/Enpho_st";

  const services = [
    {
      icon: Camera,
      title: "تصوير عقاري احترافي",
      description: "صور داخلية وخارجية عالية الجودة تُظهر المساحات، الإضاءة، والتفاصيل بدقة."
    },
    {
      icon: Video,
      title: "تصوير فيديو سينمائي",
      description: "فيديو احترافي للعقار يعكس التجربة الحقيقية ويزيد التفاعل."
    }
  ];

  const whyUs = [
    "خبرة في إبراز جمال المساحات المعمارية",
    "فهم عميق لزوايا التصوير العقاري",
    "سرعة في التسليم",
    "جودة احترافية عالية",
    "تصوير يساعد على البيع والتسويق",
    "اهتمام بالتفاصيل الصغيرة"
  ];

  const packages = [
    {
      name: "الباقة الأساسية",
      price: "750",
      features: [
        "تصوير داخلي وخارجي",
        "10 صور عالية الجودة",
        "معالجة احترافية",
        "تسليم خلال 48 ساعة",
        "صيغة رقمية عالية الدقة"
      ]
    },
    {
      name: "الباقة المتقدمة",
      price: "1500",
      features: [
        "تصوير داخلي وخارجي",
        "20 صورة عالية الجودة",
        "معالجة احترافية متقدمة",
        "فيديو قصير 1 دقيقة",
        "تسليم خلال 24 ساعة",
        "صيغة رقمية عالية الدقة"
      ],
      popular: true
    },
    {
      name: "الباقة الفاخرة",
      price: "3000",
      features: [
        "تصوير داخلي وخارجي كامل",
        "40 صورة عالية الجودة",
        "معالجة احترافية متقدمة",
        "فيديو سينمائي 3 دقائق",
        "جولة افتراضية تفاعلية",
        "تسليم فوري خلال 12 ساعة"
      ]
    }
  ];

  const portfolioItems = [
    { image: imgZV3A9167 },
    { image: imgZV3A9535 },
    { image: imgZV3A9477 },
    { image: imgZV3A9242 },
    { image: img5_1 },
    { image: img15 },
    { image: img20 },
    { image: img23 },
    { image: img46_1 },
    { image: img59_1 },
    { image: imgZV3A9180 },
    { image: imgZV3A9560 }
  ];


  const steps = [
    "تواصل معنا وحدد احتياجك",
    "معاينة العقار أو معرفة التفاصيل",
    "تحديد موعد التصوير",
    "تنفيذ الجلسة باحترافية",
    "تسليم الصور والفيديو خلال الوقت المتفق"
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl" style={{ fontFamily: "'Cairo', sans-serif" }}>
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 right-0 left-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#d4af37]/20"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="w-8 h-8 text-[#d4af37]" />
            <span className="font-bold tracking-wider" style={{ fontSize: '1.5rem' }}>Enphost</span>
          </div>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] px-6 py-2.5 rounded-full hover:scale-105 transition-transform duration-300 font-semibold shadow-lg shadow-[#d4af37]/30"
          >
            تواصل معنا
          </a>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1767950470198-c9cd97f8ed87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Luxury Villa"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/90 via-[#0a0a0f]/80 to-[#0a0a0f]"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/5 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="mb-6 leading-tight" style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              نحوّل العقار إلى تجربة بصرية<br />تبيع قبل الزيارة
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-4 text-gray-300 max-w-3xl mx-auto leading-relaxed"
            style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}
          >
            تصوير احترافي للعقارات، الفلل، المشاريع، الشقق، والفنادق
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mb-12 text-[#d4af37] max-w-3xl mx-auto"
            style={{ fontSize: 'clamp(1rem, 1.8vw, 1.2rem)' }}
          >
            بإخراج بصري يعكس الفخامة، يرفع قيمة العقار، ويزيد فرص البيع والتأجير
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] px-10 py-4 rounded-full hover:scale-105 transition-all duration-300 font-bold shadow-2xl shadow-[#d4af37]/40 hover:shadow-[#d4af37]/60"
              style={{ fontSize: '1.2rem' }}
            >
              اطلب جلسة تصوير
            </a>
            <a
              href="#portfolio"
              className="border-2 border-[#d4af37] text-[#d4af37] px-10 py-4 rounded-full hover:bg-[#d4af37] hover:text-[#0a0a0f] transition-all duration-300 font-bold"
              style={{ fontSize: '1.2rem' }}
            >
              شاهد أعمالنا
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1, repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          >
            <ChevronDown className="w-8 h-8 text-[#d4af37]" />
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-32 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f16] to-[#0a0a0f] relative">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="mb-4 font-bold" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontFamily: "'Tajawal', sans-serif",
              color: '#d4af37'
            }}>
              خدماتنا
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -10 }}
                className="bg-gradient-to-br from-[#1a1a24] to-[#0f0f16] p-8 rounded-2xl border border-[#d4af37]/20 hover:border-[#d4af37]/50 transition-all duration-300 shadow-xl hover:shadow-[#d4af37]/20 group"
              >
                <service.icon className="w-14 h-14 text-[#d4af37] mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="mb-4 font-bold" style={{ fontSize: '1.5rem' }}>{service.title}</h3>
                <p className="text-gray-400 leading-relaxed" style={{ fontSize: '1.05rem' }}>
                  {service.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/5 to-transparent"></div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="mb-4 font-bold" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontFamily: "'Tajawal', sans-serif",
              color: '#d4af37'
            }}>
              لماذا يختارنا عملاؤنا؟
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {whyUs.map((reason, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-gradient-to-r from-[#1a1a24] to-[#0f0f16] p-6 rounded-xl border-r-4 border-[#d4af37] hover:border-r-8 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-3 h-3 bg-[#d4af37] rounded-full group-hover:scale-150 transition-transform duration-300"></div>
                  <p className="font-semibold" style={{ fontSize: '1.15rem' }}>{reason}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f16] to-[#0a0a0f] relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, #d4af37 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="mb-4 font-bold" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontFamily: "'Tajawal', sans-serif",
              color: '#d4af37'
            }}>
              باقاتنا
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6" style={{ fontSize: '1.2rem' }}>
              اختر الباقة المناسبة لاحتياجاتك
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto"></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {packages.map((pkg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative bg-gradient-to-br from-[#1a1a24] to-[#0f0f16] p-8 rounded-3xl border-2 transition-all duration-300 hover:scale-105 ${
                  pkg.popular
                    ? 'border-[#d4af37] shadow-2xl shadow-[#d4af37]/30'
                    : 'border-[#d4af37]/20 hover:border-[#d4af37]/50'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 right-1/2 transform translate-x-1/2 bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] px-6 py-2 rounded-full font-bold shadow-lg">
                    الأكثر طلباً
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="mb-4 font-bold" style={{ fontSize: '1.8rem' }}>
                    {pkg.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="font-bold text-[#d4af37]" style={{ fontSize: '3.5rem' }}>
                      {pkg.price}
                    </span>
                    <span className="text-gray-400" style={{ fontSize: '1.5rem' }}>
                      ريال
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {pkg.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#d4af37] rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-300" style={{ fontSize: '1.05rem' }}>
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block w-full text-center py-4 rounded-full font-bold transition-all duration-300 hover:scale-105 shadow-lg ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f4d799] text-[#0a0a0f] hover:shadow-[#d4af37]/50'
                      : 'border-2 border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0a0a0f]'
                  }`}
                  style={{ fontSize: '1.1rem' }}
                >
                  احجز الآن
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-32 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f16] to-[#0a0a0f]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="mb-4 font-bold" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontFamily: "'Tajawal', sans-serif",
              color: '#d4af37'
            }}>
              أعمالنا
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto"></div>
          </motion.div>

          {/* Video Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h3 className="mb-8 font-bold text-center text-[#d4af37]" style={{ fontSize: '2rem' }}>
              فيديو سينمائي
            </h3>
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-3xl border-2 border-[#d4af37]/30 hover:border-[#d4af37] transition-all duration-300 shadow-2xl shadow-[#d4af37]/20"
              >
                <video
                  controls
                  className="w-full aspect-video object-cover"
                  poster=""
                >
                  <source src={videoSample} type="video/mp4" />
                  المتصفح لا يدعم تشغيل الفيديو
                </video>
              </motion.div>
            </div>
          </motion.div>

          {/* Images Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="mb-8 font-bold text-center text-[#d4af37]" style={{ fontSize: '2rem' }}>
              التصوير الفوتوغرافي
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioItems.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative overflow-hidden rounded-2xl group cursor-pointer aspect-[4/3]"
                >
                  <img
                    src={item.image}
                    alt="عمل تصوير عقاري"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/50 to-transparent opacity-0 group-hover:opacity-70 transition-opacity duration-300"></div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1757264119016-7e6b568b810d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920"
            alt="Background"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-transparent to-[#0a0a0f]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="mb-8 font-bold leading-tight" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontFamily: "'Tajawal', sans-serif",
              color: '#d4af37'
            }}>
              نحن لا نصور فقط…<br />نحن نساعدك على البيع
            </h2>

            <p className="mb-12 text-gray-300 leading-relaxed" style={{ fontSize: '1.3rem' }}>
              المحتوى البصري الاحترافي يرفع من:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "سرعة بيع العقار",
                "ثقة العميل",
                "عدد الاستفسارات",
                "قيمة العلامة العقارية"
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gradient-to-br from-[#d4af37]/20 to-[#d4af37]/5 border border-[#d4af37]/30 rounded-2xl p-8 hover:border-[#d4af37] transition-all duration-300"
                >
                  <p className="font-bold" style={{ fontSize: '1.5rem' }}>{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#d4af37]/5 to-transparent"></div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="mb-8 font-bold" style={{
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                fontFamily: "'Tajawal', sans-serif",
                color: '#d4af37'
              }}>
                عن المصور
              </h2>
              <p className="text-gray-300 leading-relaxed mb-6" style={{ fontSize: '1.2rem' }}>
                أنا مصور عقاري متخصص في إبراز جمال المساحات المعمارية والعقارات بأسلوب احترافي يخدم التسويق والبيع.
              </p>
              <p className="text-gray-300 leading-relaxed" style={{ fontSize: '1.2rem' }}>
                أجمع بين الحس البصري، فهم التصميم، والخبرة في إخراج المحتوى الذي يخلق انطباعًا قويًا من أول نظرة.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1622015663084-307d19eabbbf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080"
                  alt="About"
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] to-transparent opacity-50"></div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-[#d4af37] opacity-20 blur-3xl"></div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#d4af37] opacity-20 blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-32 bg-gradient-to-b from-[#0a0a0f] via-[#0f0f16] to-[#0a0a0f]">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <h2 className="mb-4 font-bold" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontFamily: "'Tajawal', sans-serif",
              color: '#d4af37'
            }}>
              كيف نعمل؟
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mx-auto"></div>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex items-start gap-6 mb-8 group"
              >
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#d4af37] to-[#f4d799] rounded-full flex items-center justify-center font-bold group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-[#d4af37]/30" style={{ fontSize: '1.5rem' }}>
                  {index + 1}
                </div>
                <div className="flex-1 bg-gradient-to-r from-[#1a1a24] to-[#0f0f16] p-6 rounded-2xl border border-[#d4af37]/20 group-hover:border-[#d4af37]/50 transition-all duration-300">
                  <p className="font-semibold" style={{ fontSize: '1.3rem' }}>{step}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent"></div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h2 className="mb-6 font-bold leading-tight" style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontFamily: "'Tajawal', sans-serif",
              color: '#d4af37'
            }}>
              جاهز لإظهار عقارك بأفضل صورة؟
            </h2>
            <p className="mb-12 text-gray-300" style={{ fontSize: '1.3rem' }}>
              تواصل معنا الآن واحصل على تجربة تصوير احترافية ترفع من قيمة مشروعك
            </p>

            <div className="flex flex-wrap gap-6 justify-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-[#25D366] hover:bg-[#20BA5A] text-white px-10 py-5 rounded-full transition-all duration-300 font-bold shadow-2xl hover:scale-105"
                style={{ fontSize: '1.2rem' }}
              >
                <MessageCircle className="w-6 h-6" />
                واتساب
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gradient-to-r from-[#E1306C] to-[#C13584] text-white px-10 py-5 rounded-full hover:scale-105 transition-all duration-300 font-bold shadow-2xl"
                style={{ fontSize: '1.2rem' }}
              >
                <Instagram className="w-6 h-6" />
                إنستغرام
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0f] border-t border-[#d4af37]/20 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-8 h-8 text-[#d4af37]" />
                <span className="font-bold" style={{ fontSize: '1.5rem' }}>Enphost</span>
              </div>
              <p className="text-gray-400" style={{ fontSize: '1rem' }}>
                تصوير احترافي يرفع قيمة عقارك
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-[#d4af37]" style={{ fontSize: '1.2rem' }}>التواصل</h3>
              <div className="space-y-2">
                <p className="text-gray-400" dir="ltr" style={{ fontSize: '1.1rem' }}>0599991078</p>
                <p className="text-gray-400" style={{ fontSize: '1.1rem' }}>info@photographer.com</p>
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-4 text-[#d4af37]" style={{ fontSize: '1.2rem' }}>تابعنا</h3>
              <div className="flex gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300"
                >
                  <MessageCircle className="w-6 h-6" />
                </a>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-gradient-to-r from-[#E1306C] to-[#C13584] rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-[#d4af37]/20 pt-8 text-center">
            <p className="text-gray-400" style={{ fontSize: '1rem' }}>
              © 2026 جميع الحقوق محفوظة - Enphost
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
