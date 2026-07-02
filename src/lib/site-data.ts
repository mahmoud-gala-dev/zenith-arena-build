import heroImg from "@/assets/hero.jpg";
import football from "@/assets/project-football.jpg";
import athletics from "@/assets/project-athletics.jpg";
import multipurpose from "@/assets/project-multipurpose.jpg";
import tennis from "@/assets/project-tennis.jpg";
import swimming from "@/assets/project-swimming.jpg";
import padel from "@/assets/project-padel.jpg";
import aboutImg from "@/assets/about-facility.jpg";
import servicesHeroAsset from "@/assets/services-hero.jpg.asset.json";
import maintenanceAsset from "@/assets/service-maintenance.jpg.asset.json";

const servicesHero = servicesHeroAsset.url;
const maintenance = maintenanceAsset.url;

export { heroImg, aboutImg, servicesHero };

export interface L {
  en: string;
  ar: string;
}

export interface Service {
  id: string;
  icon: string;
  image: string;
  title: L;
  short: L;
  description: L;
  features: L[];
}

export interface Project {
  slug: string;
  image: string;
  category: string; // key matching categories
  title: L;
  client: L;
  location: L;
  year: string;
  scope: L;
  overview: L;
  stats: { label: L; value: L }[];
}

export interface Product {
  id: string;
  image: string;
  title: L;
  category: L;
  description: L;
  certified: string;
}

export interface Article {
  slug: string;
  image: string;
  category: L;
  title: L;
  excerpt: L;
  body: L[];
  author: string;
  date: string;
  readTime: number;
}

export const projectCategories = [
  { id: "football", label: { en: "Football", ar: "كرة القدم" } },
  { id: "athletics", label: { en: "Athletics", ar: "ألعاب القوى" } },
  { id: "indoor", label: { en: "Indoor Arenas", ar: "الصالات المغلقة" } },
  { id: "racket", label: { en: "Racket Sports", ar: "رياضات المضرب" } },
  { id: "aquatics", label: { en: "Aquatics", ar: "الرياضات المائية" } },
];

export const services: Service[] = [
  {
    id: "football-pitches",
    icon: "Goal",
    image: football,
    title: { en: "Football Pitches", ar: "ملاعب كرة القدم" },
    short: { en: "Natural & hybrid turf systems", ar: "أنظمة عشب طبيعي وهجين" },
    description: {
      en: "FIFA Quality Pro natural, hybrid and synthetic pitches engineered with precision drainage, irrigation and shock-pad systems for elite play.",
      ar: "ملاعب طبيعية وهجينة وصناعية بمعايير FIFA Quality Pro مع أنظمة تصريف وري وطبقات امتصاص صدمات دقيقة للأداء النخبوي.",
    },
    features: [
      { en: "FIFA Quality Pro certified surfaces", ar: "أسطح معتمدة FIFA Quality Pro" },
      { en: "Sub-air drainage & irrigation", ar: "تصريف وري تحت السطح" },
      { en: "Hybrid stitched turf", ar: "عشب هجين مخيط" },
    ],
  },
  {
    id: "athletics-tracks",
    icon: "Timer",
    image: athletics,
    title: { en: "Athletics Tracks", ar: "مضامير ألعاب القوى" },
    short: { en: "IAAF-certified running tracks", ar: "مضامير معتمدة من الاتحاد الدولي" },
    description: {
      en: "World Athletics certified polyurethane and sandwich-system running tracks delivering consistent energy return and slip resistance.",
      ar: "مضامير بولي يوريثان بنظام ساندويتش معتمدة من الاتحاد الدولي لألعاب القوى توفر ارتداد طاقة ثابتًا ومقاومة انزلاق.",
    },
    features: [
      { en: "World Athletics Class 1 & 2", ar: "الفئة 1 و2 من الاتحاد الدولي" },
      { en: "Full-PU & sandwich systems", ar: "أنظمة بولي يوريثان كاملة وساندويتش" },
      { en: "Precision line marking", ar: "ترسيم خطوط دقيق" },
    ],
  },
  {
    id: "indoor-halls",
    icon: "Warehouse",
    image: multipurpose,
    title: { en: "Indoor Sports Halls", ar: "الصالات الرياضية المغلقة" },
    short: { en: "Multi-sport arenas & flooring", ar: "صالات متعددة الرياضات وأرضيات" },
    description: {
      en: "Turnkey indoor arenas with steel structures, acoustic treatment, and certified sprung timber or vinyl multi-sport flooring.",
      ar: "صالات مغلقة متكاملة بهياكل حديدية ومعالجة صوتية وأرضيات خشبية مرنة أو فينيل متعددة الرياضات معتمدة.",
    },
    features: [
      { en: "Steel & tensile structures", ar: "هياكل حديدية وشدّية" },
      { en: "Sprung timber flooring", ar: "أرضيات خشبية مرنة" },
      { en: "Acoustic & lighting design", ar: "تصميم صوتي وإضاءة" },
    ],
  },
  {
    id: "courts",
    icon: "LayoutGrid",
    image: tennis,
    title: { en: "Tennis & Padel Courts", ar: "ملاعب التنس والبادل" },
    short: { en: "Acrylic, clay & glass courts", ar: "ملاعب أكريليك وطين وزجاج" },
    description: {
      en: "Championship acrylic hard courts, clay courts and panoramic glass padel courts with professional lighting and fencing systems.",
      ar: "ملاعب أكريليك للبطولات وملاعب طينية وملاعب بادل زجاجية بانورامية مع أنظمة إضاءة وتسييج احترافية.",
    },
    features: [
      { en: "ITF-approved surfaces", ar: "أسطح معتمدة من ITF" },
      { en: "Panoramic glass padel", ar: "بادل زجاجي بانورامي" },
      { en: "LED sports lighting", ar: "إضاءة رياضية LED" },
    ],
  },
  {
    id: "aquatics",
    icon: "Waves",
    image: swimming,
    title: { en: "Aquatic Centers", ar: "المراكز المائية" },
    short: { en: "Competition & training pools", ar: "مسابح تنافسية وتدريبية" },
    description: {
      en: "Competition-grade pools with stainless steel systems, advanced filtration, timing systems and full mechanical infrastructure.",
      ar: "مسابح بمواصفات المسابقات بأنظمة ستانلس ستيل وترشيح متقدم وأنظمة توقيت وبنية ميكانيكية متكاملة.",
    },
    features: [
      { en: "FINA-compliant dimensions", ar: "أبعاد مطابقة لـ FINA" },
      { en: "Advanced filtration", ar: "ترشيح متقدم" },
      { en: "Electronic timing", ar: "توقيت إلكتروني" },
    ],
  },
  {
    id: "maintenance",
    icon: "Wrench",
    image: maintenance,
    title: { en: "Maintenance & Care", ar: "الصيانة والرعاية" },
    short: { en: "Lifecycle facility management", ar: "إدارة دورة حياة المنشأة" },
    description: {
      en: "Preventive and corrective maintenance programs, resurfacing and certification renewals to protect your investment for decades.",
      ar: "برامج صيانة وقائية وتصحيحية وإعادة تأهيل الأسطح وتجديد الاعتمادات لحماية استثمارك لعقود.",
    },
    features: [
      { en: "Preventive programs", ar: "برامج وقائية" },
      { en: "Resurfacing & renewal", ar: "إعادة تأهيل وتجديد" },
      { en: "Certification renewal", ar: "تجديد الاعتمادات" },
    ],
  },
];

export const projects: Project[] = [
  {
    slug: "royal-arena-stadium",
    image: football,
    category: "football",
    title: { en: "Royal Arena Stadium", ar: "استاد رويال أرينا" },
    client: { en: "National Football Federation", ar: "الاتحاد الوطني لكرة القدم" },
    location: { en: "Riyadh, Saudi Arabia", ar: "الرياض، السعودية" },
    year: "2024",
    scope: { en: "Design, Build & Turf", ar: "تصميم وتنفيذ وعشب" },
    overview: {
      en: "A 45,000-seat national stadium featuring a FIFA Quality Pro hybrid pitch, sub-air ventilation and a fully retractable roof — delivered turnkey in 22 months.",
      ar: "استاد وطني بسعة 45,000 مقعد يضم ملعبًا هجينًا بمعايير FIFA Quality Pro وتهوية تحت السطح وسقف قابل للسحب بالكامل — تم تسليمه مفتاح باليد خلال 22 شهرًا.",
    },
    stats: [
      { label: { en: "Capacity", ar: "السعة" }, value: { en: "45,000", ar: "45,000" } },
      { label: { en: "Pitch", ar: "الملعب" }, value: { en: "Hybrid", ar: "هجين" } },
      { label: { en: "Duration", ar: "المدة" }, value: { en: "22 months", ar: "22 شهرًا" } },
    ],
  },
  {
    slug: "olympic-athletics-complex",
    image: athletics,
    category: "athletics",
    title: { en: "Olympic Athletics Complex", ar: "مجمع ألعاب القوى الأولمبي" },
    client: { en: "Ministry of Sports", ar: "وزارة الرياضة" },
    location: { en: "Doha, Qatar", ar: "الدوحة، قطر" },
    year: "2023",
    scope: { en: "Track & Field Systems", ar: "أنظمة المضمار والميدان" },
    overview: {
      en: "A World Athletics Class 1 certified track with full field-event facilities, delivered for international competition hosting.",
      ar: "مضمار معتمد من الفئة 1 للاتحاد الدولي لألعاب القوى مع مرافق فعاليات ميدانية كاملة، تم تسليمه لاستضافة المنافسات الدولية.",
    },
    stats: [
      { label: { en: "Certification", ar: "الاعتماد" }, value: { en: "Class 1", ar: "الفئة 1" } },
      { label: { en: "Lanes", ar: "المسارات" }, value: { en: "9", ar: "9" } },
      { label: { en: "Surface", ar: "السطح" }, value: { en: "Full-PU", ar: "بولي يوريثان" } },
    ],
  },
  {
    slug: "elite-indoor-arena",
    image: multipurpose,
    category: "indoor",
    title: { en: "Elite Indoor Arena", ar: "أرينا النخبة المغلقة" },
    client: { en: "City Sports Authority", ar: "هيئة رياضة المدينة" },
    location: { en: "Dubai, UAE", ar: "دبي، الإمارات" },
    year: "2024",
    scope: { en: "Structure & Flooring", ar: "الهيكل والأرضيات" },
    overview: {
      en: "A multi-purpose indoor arena with certified sprung timber flooring, retractable seating and broadcast-grade lighting.",
      ar: "أرينا مغلقة متعددة الأغراض بأرضية خشبية مرنة معتمدة ومقاعد قابلة للسحب وإضاءة بمستوى البث.",
    },
    stats: [
      { label: { en: "Area", ar: "المساحة" }, value: { en: "6,200 m²", ar: "6,200 م²" } },
      { label: { en: "Seating", ar: "المقاعد" }, value: { en: "3,500", ar: "3,500" } },
      { label: { en: "Sports", ar: "الرياضات" }, value: { en: "8+", ar: "+8" } },
    ],
  },
  {
    slug: "grand-slam-tennis-park",
    image: tennis,
    category: "racket",
    title: { en: "Grand Slam Tennis Park", ar: "حديقة الجراند سلام للتنس" },
    client: { en: "Regional Tennis Club", ar: "نادي التنس الإقليمي" },
    location: { en: "Amman, Jordan", ar: "عمّان، الأردن" },
    year: "2023",
    scope: { en: "12 Courts & Facilities", ar: "12 ملعبًا ومرافق" },
    overview: {
      en: "A twelve-court tennis park with ITF-approved acrylic surfaces, LED lighting and a central show court with spectator stands.",
      ar: "حديقة تنس من اثني عشر ملعبًا بأسطح أكريليك معتمدة من ITF وإضاءة LED وملعب مركزي بمدرجات للجمهور.",
    },
    stats: [
      { label: { en: "Courts", ar: "الملاعب" }, value: { en: "12", ar: "12" } },
      { label: { en: "Surface", ar: "السطح" }, value: { en: "Acrylic", ar: "أكريليك" } },
      { label: { en: "Lighting", ar: "الإضاءة" }, value: { en: "LED", ar: "LED" } },
    ],
  },
  {
    slug: "aqua-performance-center",
    image: swimming,
    category: "aquatics",
    title: { en: "Aqua Performance Center", ar: "مركز الأداء المائي" },
    client: { en: "University Sports Dept.", ar: "قسم الرياضة الجامعي" },
    location: { en: "Kuwait City, Kuwait", ar: "مدينة الكويت، الكويت" },
    year: "2022",
    scope: { en: "Competition Pool", ar: "مسبح تنافسي" },
    overview: {
      en: "A FINA-compliant 50m competition pool with a stainless steel system, electronic timing and energy-efficient filtration.",
      ar: "مسبح تنافسي 50 مترًا مطابق لـ FINA بنظام ستانلس ستيل وتوقيت إلكتروني وترشيح موفّر للطاقة.",
    },
    stats: [
      { label: { en: "Length", ar: "الطول" }, value: { en: "50 m", ar: "50 م" } },
      { label: { en: "Lanes", ar: "المسارات" }, value: { en: "10", ar: "10" } },
      { label: { en: "Standard", ar: "المعيار" }, value: { en: "FINA", ar: "FINA" } },
    ],
  },
  {
    slug: "skyline-padel-club",
    image: padel,
    category: "racket",
    title: { en: "Skyline Padel Club", ar: "نادي سكاي لاين للبادل" },
    client: { en: "Private Developer", ar: "مطوّر خاص" },
    location: { en: "Manama, Bahrain", ar: "المنامة، البحرين" },
    year: "2024",
    scope: { en: "8 Panoramic Courts", ar: "8 ملاعب بانورامية" },
    overview: {
      en: "A rooftop padel destination with eight panoramic glass courts, premium turf and immersive LED lighting.",
      ar: "وجهة بادل على السطح بثمانية ملاعب زجاجية بانورامية وعشب فاخر وإضاءة LED غامرة.",
    },
    stats: [
      { label: { en: "Courts", ar: "الملاعب" }, value: { en: "8", ar: "8" } },
      { label: { en: "Type", ar: "النوع" }, value: { en: "Panoramic", ar: "بانورامي" } },
      { label: { en: "Level", ar: "المستوى" }, value: { en: "Rooftop", ar: "سطح المبنى" } },
    ],
  },
];

export const products: Product[] = [
  {
    id: "hybrid-turf",
    image: football,
    title: { en: "ApexTurf Hybrid 60", ar: "أبيكس تيرف هايبرد 60" },
    category: { en: "Playing Surfaces", ar: "أسطح اللعب" },
    description: {
      en: "Reinforced hybrid turf combining natural grass with 60mm engineered fibers for durability and playability.",
      ar: "عشب هجين معزز يجمع العشب الطبيعي مع ألياف هندسية 60 مم لمتانة وقابلية لعب عالية.",
    },
    certified: "FIFA Quality Pro",
  },
  {
    id: "pu-track",
    image: athletics,
    title: { en: "ApexRun Sandwich PU", ar: "أبيكس ران ساندويتش PU" },
    category: { en: "Track Systems", ar: "أنظمة المضمار" },
    description: {
      en: "13mm sandwich-system polyurethane track with superior energy return and all-weather resistance.",
      ar: "مضمار بولي يوريثان بنظام ساندويتش 13 مم بارتداد طاقة فائق ومقاومة لكل الأحوال الجوية.",
    },
    certified: "World Athletics",
  },
  {
    id: "sprung-floor",
    image: multipurpose,
    title: { en: "ApexCourt Sprung Maple", ar: "أبيكس كورت سبرنغ ميبل" },
    category: { en: "Indoor Flooring", ar: "أرضيات داخلية" },
    description: {
      en: "Area-elastic sprung maple flooring engineered for shock absorption and consistent ball bounce.",
      ar: "أرضية ميبل مرنة مصممة لامتصاص الصدمات وارتداد كرة ثابت.",
    },
    certified: "EN 14904 A4",
  },
  {
    id: "acrylic-court",
    image: tennis,
    title: { en: "ApexPro Acrylic", ar: "أبيكس برو أكريليك" },
    category: { en: "Court Surfaces", ar: "أسطح الملاعب" },
    description: {
      en: "Multi-layer cushioned acrylic system for tennis and multi-use courts with UV-stable pigments.",
      ar: "نظام أكريليك متعدد الطبقات ممتص للصدمات لملاعب التنس والاستخدامات المتعددة بأصباغ ثابتة ضد الأشعة.",
    },
    certified: "ITF Classified",
  },
  {
    id: "glass-padel",
    image: padel,
    title: { en: "ApexGlass Padel System", ar: "نظام أبيكس جلاس للبادل" },
    category: { en: "Structures", ar: "الهياكل" },
    description: {
      en: "12mm tempered panoramic glass padel court structure with galvanized steel frame and LED integration.",
      ar: "هيكل ملعب بادل بزجاج مقسّى بانورامي 12 مم بإطار فولاذي مجلفن وتكامل إضاءة LED.",
    },
    certified: "WPT Standard",
  },
  {
    id: "led-lighting",
    image: multipurpose,
    title: { en: "ApexLux Sports LED", ar: "أبيكس لوكس LED رياضي" },
    category: { en: "Lighting", ar: "الإضاءة" },
    description: {
      en: "Broadcast-grade LED sports lighting with anti-glare optics and smart dimming control.",
      ar: "إضاءة رياضية LED بمستوى البث بعدسات مانعة للوهج وتحكّم ذكي في الإضاءة.",
    },
    certified: "EN 12193",
  },
];

export const articles: Article[] = [
  {
    slug: "choosing-the-right-football-turf",
    image: football,
    category: { en: "Guides", ar: "أدلة" },
    title: {
      en: "Natural, Hybrid or Synthetic: Choosing the Right Football Turf",
      ar: "طبيعي أم هجين أم صناعي: اختيار العشب المناسب لكرة القدم",
    },
    excerpt: {
      en: "A practical framework for selecting the ideal pitch system based on climate, usage and budget.",
      ar: "إطار عملي لاختيار نظام الملعب المثالي بناءً على المناخ والاستخدام والميزانية.",
    },
    body: [
      {
        en: "Selecting the right playing surface is the single most consequential decision in a football facility project. It affects player safety, playability, maintenance cost and the useful life of the pitch.",
        ar: "يُعد اختيار سطح اللعب المناسب القرار الأكثر أهمية في مشروع منشأة كرة قدم. فهو يؤثر على سلامة اللاعبين وقابلية اللعب وتكلفة الصيانة والعمر الافتراضي للملعب.",
      },
      {
        en: "Natural grass offers unrivaled feel but demands intensive maintenance and rest periods. Synthetic systems deliver near-unlimited playing hours, while hybrid turf blends the two for elite durability.",
        ar: "يوفر العشب الطبيعي إحساسًا لا يُضاهى لكنه يتطلب صيانة مكثفة وفترات راحة. توفر الأنظمة الصناعية ساعات لعب شبه غير محدودة، بينما يجمع العشب الهجين بين الاثنين لمتانة نخبوية.",
      },
      {
        en: "Our engineers evaluate climate, drainage, expected usage hours and target certification to recommend the optimal system for each project.",
        ar: "يقيّم مهندسونا المناخ والتصريف وساعات الاستخدام المتوقعة والاعتماد المستهدف لتوصية النظام الأمثل لكل مشروع.",
      },
    ],
    author: "Eng. Omar Khalid",
    date: "2025-01-18",
    readTime: 6,
  },
  {
    slug: "understanding-world-athletics-certification",
    image: athletics,
    category: { en: "Standards", ar: "معايير" },
    title: {
      en: "Understanding World Athletics Track Certification",
      ar: "فهم اعتماد مضامير الاتحاد الدولي لألعاب القوى",
    },
    excerpt: {
      en: "What Class 1 and Class 2 certifications mean and how they impact competition hosting.",
      ar: "ماذا يعني اعتماد الفئة 1 والفئة 2 وكيف يؤثران على استضافة المنافسات.",
    },
    body: [
      {
        en: "World Athletics certification guarantees a track meets strict standards for thickness, energy return, and geometry. Class 1 is required for international championships.",
        ar: "يضمن اعتماد الاتحاد الدولي لألعاب القوى أن المضمار يفي بمعايير صارمة للسمك وارتداد الطاقة والهندسة. الفئة 1 مطلوبة للبطولات الدولية.",
      },
      {
        en: "Achieving certification requires precise construction, independent testing, and meticulous documentation throughout the build.",
        ar: "يتطلب الحصول على الاعتماد بناءً دقيقًا واختبارًا مستقلًا وتوثيقًا دقيقًا طوال فترة التنفيذ.",
      },
    ],
    author: "Eng. Layla Hassan",
    date: "2025-02-04",
    readTime: 5,
  },
  {
    slug: "maintenance-that-protects-your-investment",
    image: aboutImg,
    category: { en: "Case Study", ar: "دراسة حالة" },
    title: {
      en: "Maintenance Programs That Protect Your Investment",
      ar: "برامج الصيانة التي تحمي استثمارك",
    },
    excerpt: {
      en: "How a structured maintenance plan doubled the lifespan of a client's synthetic pitches.",
      ar: "كيف ضاعفت خطة صيانة منظمة العمر الافتراضي لملاعب صناعية لأحد العملاء.",
    },
    body: [
      {
        en: "A leading sports club approached us with prematurely degrading synthetic pitches. Our audit revealed inadequate infill maintenance and drainage neglect.",
        ar: "تواصل معنا نادٍ رياضي رائد بشأن ملاعب صناعية تتدهور قبل أوانها. كشف تدقيقنا عن صيانة غير كافية للحشو وإهمال في التصريف.",
      },
      {
        en: "By implementing a quarterly maintenance program, we restored performance and extended the surface lifespan by over eight years.",
        ar: "من خلال تطبيق برنامج صيانة ربع سنوي، استعدنا الأداء ومددنا العمر الافتراضي للسطح لأكثر من ثماني سنوات.",
      },
    ],
    author: "Eng. Sami Nasser",
    date: "2025-02-20",
    readTime: 7,
  },
  {
    slug: "designing-multi-sport-indoor-arenas",
    image: multipurpose,
    category: { en: "Guides", ar: "أدلة" },
    title: {
      en: "Designing Flexible Multi-Sport Indoor Arenas",
      ar: "تصميم صالات رياضية مغلقة متعددة الاستخدامات",
    },
    excerpt: {
      en: "Key considerations for flooring, acoustics and lighting in multi-purpose venues.",
      ar: "اعتبارات أساسية للأرضيات والصوتيات والإضاءة في الصالات متعددة الأغراض.",
    },
    body: [
      {
        en: "Multi-sport arenas must balance the differing demands of basketball, volleyball, handball and events, often within the same week.",
        ar: "يجب أن توازن الصالات متعددة الرياضات بين المتطلبات المختلفة لكرة السلة والطائرة واليد والفعاليات، غالبًا خلال الأسبوع نفسه.",
      },
      {
        en: "Area-elastic flooring, retractable seating and tunable acoustics are the foundation of a truly versatile venue.",
        ar: "تُعد الأرضيات المرنة والمقاعد القابلة للسحب والصوتيات القابلة للضبط أساس الصالة متعددة الاستخدامات حقًا.",
      },
    ],
    author: "Eng. Nour Fadel",
    date: "2025-03-02",
    readTime: 6,
  },
];

export interface ClientLogo {
  name: { en: string; ar: string };
  sector: { en: string; ar: string };
  monogram: string; // 2–3 chars used as SVG mark
  accent: string; // css color for the mark
}

export const clients: ClientLogo[] = [
  {
    name: { en: "Egyptian Football Association", ar: "الاتحاد المصري لكرة القدم" },
    sector: { en: "National Federation", ar: "اتحاد وطني" },
    monogram: "EFA",
    accent: "#c9a84c",
  },
  {
    name: { en: "Ministry of Youth & Sports", ar: "وزارة الشباب والرياضة" },
    sector: { en: "Government", ar: "جهة حكومية" },
    monogram: "MYS",
    accent: "#0f6b3a",
  },
  {
    name: { en: "Egyptian Olympic Committee", ar: "اللجنة الأولمبية المصرية" },
    sector: { en: "Olympic Committee", ar: "لجنة أولمبية" },
    monogram: "EOC",
    accent: "#1e40af",
  },
  {
    name: { en: "Al Ahly SC", ar: "النادي الأهلي" },
    sector: { en: "Premier Club", ar: "نادٍ محترف" },
    monogram: "AH",
    accent: "#b91c1c",
  },
  {
    name: { en: "Zamalek SC", ar: "نادي الزمالك" },
    sector: { en: "Premier Club", ar: "نادٍ محترف" },
    monogram: "ZS",
    accent: "#0e7490",
  },
  {
    name: { en: "Cairo University", ar: "جامعة القاهرة" },
    sector: { en: "University Athletics", ar: "رياضة جامعية" },
    monogram: "CU",
    accent: "#7c3aed",
  },
  {
    name: { en: "New Administrative Capital", ar: "العاصمة الإدارية الجديدة" },
    sector: { en: "Mega Development", ar: "تطوير كبير" },
    monogram: "NAC",
    accent: "#0f766e",
  },
  {
    name: { en: "Alexandria Sports Authority", ar: "هيئة الإسكندرية للرياضة" },
    sector: { en: "City Authority", ar: "هيئة محلية" },
    monogram: "ASA",
    accent: "#c2410c",
  },
  {
    name: { en: "Pyramids FC", ar: "نادي بيراميدز" },
    sector: { en: "Premier Club", ar: "نادٍ محترف" },
    monogram: "PFC",
    accent: "#0369a1",
  },
  {
    name: { en: "Suez Canal Authority", ar: "هيئة قناة السويس" },
    sector: { en: "Public Sector", ar: "قطاع عام" },
    monogram: "SCA",
    accent: "#065f46",
  },
  {
    name: { en: "British International School", ar: "المدرسة البريطانية الدولية" },
    sector: { en: "International School", ar: "مدرسة دولية" },
    monogram: "BIS",
    accent: "#334155",
  },
  {
    name: { en: "Ministry of Education", ar: "وزارة التربية والتعليم" },
    sector: { en: "Government", ar: "جهة حكومية" },
    monogram: "MOE",
    accent: "#9d174d",
  },
];


export interface Testimonial {
  quote: L;
  name: string;
  role: L;
}

export const testimonials: Testimonial[] = [
  {
    quote: {
      en: "Apex delivered our national stadium ahead of schedule and beyond specification. Their engineering discipline is world-class.",
      ar: "سلّمت أبيكس استادنا الوطني قبل الموعد وبمواصفات تفوق المطلوب. انضباطهم الهندسي عالمي المستوى.",
    },
    name: "Ahmed Al-Rashid",
    role: { en: "Director, National Football Federation", ar: "مدير الاتحاد الوطني لكرة القدم" },
  },
  {
    quote: {
      en: "The certified athletics track allowed us to host our first international championship. Flawless execution.",
      ar: "مكّننا المضمار المعتمد من استضافة أول بطولة دولية لنا. تنفيذ لا تشوبه شائبة.",
    },
    name: "Dr. Maha Sultan",
    role: { en: "Head of Facilities, Ministry of Sports", ar: "رئيس المرافق، وزارة الرياضة" },
  },
  {
    quote: {
      en: "From concept to handover, Apex was a single accountable partner. We would build with them again without hesitation.",
      ar: "من الفكرة حتى التسليم، كانت أبيكس شريكًا واحدًا مسؤولًا. سنبني معهم مجددًا دون تردد.",
    },
    name: "Khalid Mansour",
    role: { en: "CEO, City Sports Authority", ar: "الرئيس التنفيذي، هيئة رياضة المدينة" },
  },
];

export const heroStats = [
  { value: "420+", key: "stat1" as const },
  { value: "18", key: "stat2" as const },
  { value: "20", key: "stat3" as const },
  { value: "99%", key: "stat4" as const },
];

export const WHATSAPP_NUMBER = "9665XXXXXXXX";
