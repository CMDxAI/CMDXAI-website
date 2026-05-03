import React, { useState, useEffect, FormEvent } from "react";
import { createRoot } from "react-dom/client";

// --- Icons (SVG Components) ---
const ChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const ChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const MonitorPlay = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7"/><path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/></svg>
);
const BookOpen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
);
const Users = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const Code = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
);
const CheckCircle = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);
const ChevronUp = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);
// --- New Icons for LMS/App Section ---
const Smartphone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
);
const Palette = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.01 17.461 2 12 2z"/></svg>
);
const Bell = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const ShoppingBag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
const Type = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>
);
const X = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 18 18"/></svg>
);
// Logo Icon (Shield with Pen)
const ShieldPen = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M12 8v8"/>
    <path d="m9 13 3 3 3-3"/>
    <path d="m9 10 3-2 3 2"/>
  </svg>
);


// --- Components ---

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Services", href: "#services" },
    { name: "Professional", href: "#professional" },
    { name: "LMS", href: "#lms" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed w-full z-50 bg-white shadow-md font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className="font-bold text-2xl text-blue-900 tracking-tight">CMDx</span>
          </div>

          {/* Desktop Menu - Centered */}
          <div className="hidden md:flex space-x-8 items-center justify-center flex-1 mx-10">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href} 
                className="text-gray-700 hover:text-teal-600 px-1 py-2 text-base font-bold transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
          </div>

          {/* Right Actions - Login/Register */}

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 hover:text-teal-600 p-2">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full shadow-xl">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-gray-700 hover:text-teal-600 block px-3 py-3 rounded-md text-base font-bold border-b border-gray-50"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 flex flex-col space-y-3">
               <a href="#" className="text-center text-gray-700 font-bold py-2 border border-gray-200 rounded-lg">Login</a>
               <a href="#" className="text-center bg-blue-600 text-white font-bold py-3 rounded-lg">Register</a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const Carousel = () => {
  const slides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      title: "Transforming Education Through Technology",
      subtitle: "Innovative eLearning solutions tailored for modern enterprises.",
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      title: "Custom Learning Management Systems",
      subtitle: "Scalable, open-source platforms designed for your success.",
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
      title: "Expert Instructional Design",
      subtitle: "Engaging content that drives retention and performance.",
    },
  ];

  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrent(current === 0 ? slides.length - 1 : current - 1);
  };

  const nextSlide = () => {
    setCurrent(current === slides.length - 1 ? 0 : current + 1);
  };

  return (
    <div className="relative w-full h-[600px] overflow-hidden bg-gray-900">
      <div
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="min-w-full h-full relative">
            <div className="absolute inset-0 bg-black/50 z-10" />
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in-up">
                {slide.title}
              </h1>
              <p className="text-xl md:text-2xl text-blue-200 mb-8 max-w-2xl animate-fade-in-up delay-100">
                {slide.subtitle}
              </p>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-transform hover:scale-105 shadow-lg">
                Get Started
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors">
        <ChevronLeft />
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors">
        <ChevronRight />
      </button>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-3 h-3 rounded-full transition-colors ${
              idx === current ? "bg-blue-500" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const ServicesList = () => {
  const services = [
    {
      title: "Courseware Development",
      desc: "Interactive SCORM-compliant modules tailored to your training needs.",
      icon: <MonitorPlay />,
    },
    {
      title: "LMS Hosting & Support",
      desc: "Secure cloud hosting with 24/7 technical support and maintenance.",
      icon: <Code />,
    },
    {
      title: "Mobile Learning",
      desc: "Responsive designs ensuring learning happens anywhere, anytime.",
      icon: <Users />,
    },
    {
      title: "Consulting Strategy",
      desc: "Expert guidance on digital transformation and learning roadmaps.",
      icon: <BookOpen />,
    },
  ];

  return (
    <section id="services" className="py-20 bg-gray-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Our Products & Services</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comprehensive eLearning solutions designed to elevate your workforce performance.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 group cursor-default"
            >
              <div className="w-12 h-12 bg-blue-50 text-teal-600 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProfessionalServices = () => {
  const features = [
    "Instructional Design Analysis",
    "Storyboarding & Scriptwriting",
    "Multimedia Production (Video/Audio)",
    "Localization & Translation",
    "Accessibility Compliance (WCAG)",
    "Learning Analytics Setup"
  ];

  return (
    <section id="professional" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Professional Team working" 
              className="rounded-2xl shadow-2xl"
            />
          </div>
          <div className="lg:w-1/2">
            <h2 className="text-3xl font-bold text-blue-900 mb-6">eLearning Professional Services</h2>
            <p className="text-lg text-gray-600 mb-8">
              Our team of expert instructional designers and developers work as an extension of your team. We don't just build courses; we craft learning experiences that drive behavioral change and business results.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-3">
                  <div className="text-teal-500">
                    <CheckCircle />
                  </div>
                  <span className="text-gray-700 font-medium">{feature}</span>
                </div>
              ))}
            </div>
            <button className="mt-8 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors">
              Learn More About Services
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

const LMSSection = () => {
  const features = [
    { icon: <Type />, title: "100% White-label", desc: "Your brand, your identity." },
    { icon: <X />, title: "No-Coding Required", desc: "Drag & drop builder." },
    { icon: <Palette />, title: "Visual Editor", desc: "Customize look & feel." },
    { icon: <ShoppingBag />, title: "In-App Purchases", desc: "Monetize your content." },
    { icon: <Bell />, title: "Push notifications", desc: "Engage learners instantly." },
    { icon: <Smartphone />, title: "iOS & Android native", desc: "Seamless mobile experience." },
  ];

  return (
    <section id="lms" className="py-24 bg-gray-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          
          {/* Left Content */}
          <div className="lg:w-1/2">
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900 mb-6 leading-tight">
              Build a branded <br/> mobile app for your school
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Unlock the power of mobile to boost your business, reach more audiences, and engage your students even more.
            </p>
            
            <div className="space-y-8">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start space-x-5 group">
                  <div className="flex-shrink-0 mt-1">
                     <div className="text-blue-800 w-8 h-8 group-hover:text-teal-600 transition-colors">
                        {feature.icon}
                     </div>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-900 text-lg">{feature.title}</h4>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12">
               <button className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-md font-bold text-lg transition-transform hover:-translate-y-1 shadow-lg">
                 Learn more
               </button>
            </div>
          </div>

          {/* Right Visuals */}
          <div className="lg:w-1/2 relative flex justify-center items-center">
             
             {/* Main Phone */}
             <div className="relative z-10 mx-auto">
               <img 
                 src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" 
                 alt="Mobile LMS App" 
                 className="w-64 md:w-72 rounded-[2.5rem] border-[8px] border-gray-900 shadow-2xl"
               />
               
               {/* Floating Card 1 (Left) */}
               <div className="absolute top-1/4 -left-8 md:-left-20 bg-white p-3 rounded-xl shadow-xl border border-gray-100 hidden sm:block w-36 md:w-44 animate-bounce-slow" style={{ animationDuration: '4s' }}>
                  <div className="h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden relative">
                     <img src="https://images.unsplash.com/photo-1571260899304-425eee4c7efc?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" className="w-full h-full object-cover"/>
                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                       <span className="text-white font-bold text-xs">Start Course</span>
                     </div>
                  </div>
                  <div className="h-2 w-2/3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-2 w-1/2 bg-blue-100 rounded"></div>
               </div>

               {/* Floating Card 2 (Right) */}
               <div className="absolute bottom-1/4 -right-8 md:-right-20 bg-white p-4 rounded-xl shadow-xl border border-gray-100 hidden sm:block w-36 md:w-44 animate-bounce-slow" style={{ animationDelay: '1s', animationDuration: '5s' }}>
                   <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-gray-700">Daily Goal</div>
                      <div className="text-xs font-bold text-green-600">85%</div>
                   </div>
                   <div className="w-full bg-gray-100 rounded-full h-2 mb-3">
                     <div className="bg-green-500 h-2 rounded-full w-[85%]"></div>
                   </div>
                   <button className="w-full bg-gray-900 text-white text-[10px] py-2 rounded font-semibold uppercase tracking-wider">
                     Keep Going
                   </button>
               </div>
             </div>

          </div>

        </div>
      </div>
    </section>
  );
};

const AboutSection = () => {
  return (
    <section id="about" className="py-24 bg-gray-50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6">
              About Us: 20+ Years of Open Source Excellence
            </h2>
            <div className="w-20 h-1.5 bg-blue-600 rounded-full mb-8"></div>
            
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              We are a collective of senior engineers, architects, and educators who have been shaping the eLearning landscape for over two decades. Since our inception, we have dedicated ourselves to mastering the art of open-source application development.
            </p>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Our expertise isn't just in deployment; it's in the deep customization and architectural optimization of platforms like Moodle, Totara, and Open edX. We build enterprise-grade applications that are robust, secure, and infinitely scalable, leveraging the true power of open-source communities.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg text-teal-600">
                  <Code />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">Deep Tech Stack</h4>
                  <p className="text-sm text-gray-600">PHP, React, Python, & Cloud Architecture experts.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                 <div className="bg-blue-100 p-3 rounded-lg text-teal-600">
                  <Users />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">Community Leaders</h4>
                  <p className="text-sm text-gray-600">Active contributors to major open-source projects.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                 <div className="bg-blue-100 p-3 rounded-lg text-teal-600">
                  <CheckCircle />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">Enterprise Ready</h4>
                  <p className="text-sm text-gray-600">Scalable solutions for Fortune 500 companies.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                 <div className="bg-blue-100 p-3 rounded-lg text-teal-600">
                  <BookOpen />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900">Domain Expertise</h4>
                  <p className="text-sm text-gray-600">Specialized in Pedagogy & Andragogy tech.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2 relative">
             <div className="absolute inset-0 bg-blue-600 rounded-2xl transform rotate-3 opacity-10"></div>
             <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Our experienced team" 
              className="relative rounded-2xl shadow-xl w-full object-cover"
            />
            <div className="absolute bottom-8 -left-8 bg-white p-6 rounded-xl shadow-lg max-w-xs border-l-4 border-teal-600 hidden md:block">
              <p className="text-4xl font-bold text-blue-900">20+</p>
              <p className="text-gray-600 font-medium">Years of Delivering Excellence in EdTech</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const ConfirmationModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full animate-fade-in-up text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle />
        </div>
        <h3 className="text-2xl font-bold text-blue-900 mb-2">Message Sent!</h3>
        <p className="text-gray-600 mb-6">
          Thank you for contacting CMDx. We have received your message and will get back to you shortly.
        </p>
        <button 
          onClick={onClose}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

const ContactForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Show confirmation modal
    setShowModal(true);

    // Construct mailto link
    const subject = encodeURIComponent(`CMDx Contact Form: ${formData.subject || 'Inquiry'}`);
    const body = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`);
    const mailtoLink = `mailto:cmdx.ai@gmail.com?subject=${subject}&body=${body}`;

    // Small delay to allow modal to render before opening email client
    setTimeout(() => {
        window.location.href = mailtoLink;
    }, 1000);

    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contact" className="py-20 bg-white scroll-mt-20">
      <ConfirmationModal isOpen={showModal} onClose={() => setShowModal(false)} />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-blue-900 mb-4">Get in Touch</h2>
          <p className="text-lg text-gray-600">
            Ready to transform your training? Fill out the form below.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-50 p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                placeholder="john@company.com"
              />
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
            >
              <option value="">Select a topic...</option>
              <option value="LMS">LMS Implementation</option>
              <option value="Content">Course Development</option>
              <option value="Consulting">Consulting</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="mb-8">
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all resize-none"
              placeholder="Tell us about your project needs..."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Send Message
          </button>
        </form>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-2xl font-bold text-white">CMDx</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Empowering organizations through innovative learning technology and content solutions.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-blue-400 text-sm">
              <li><a href="#" className="hover:text-teal-400">LMS Implementation</a></li>
              <li><a href="#" className="hover:text-teal-400">Course Development</a></li>
              <li><a href="#" className="hover:text-teal-400">Mobile Learning</a></li>
              <li><a href="#" className="hover:text-teal-400">Consulting</a></li>
            </ul>
          </div>


        </div>
        <div className="border-t border-gray-800 pt-8 text-center text-blue-500 text-sm">
          © {new Date().getFullYear()} CMDx Solutions. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

const App = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <Carousel />
        <ServicesList />
        <ProfessionalServices />
        <LMSSection />
        <AboutSection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);