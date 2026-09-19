import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// Компонент для плавной анимации при скролле
const FadeIn = ({ children, delay = 0, direction = 'up' }: { children: React.ReactNode, delay?: number, direction?: 'up' | 'left' | 'right' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const getTransform = () => {
        if (isVisible) return 'translate-x-0 translate-y-0';
        if (direction === 'up') return 'translate-y-12';
        if (direction === 'left') return '-translate-x-12';
        if (direction === 'right') return 'translate-x-12';
        return '';
    };

    return (
        <div
            ref={ref}
            className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'} ${getTransform()}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
};

// Компонент для раскрывающегося вопроса (Аккордеон)
const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 py-6 cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
            <div className="flex justify-between items-center w-full text-left">
                <span className={`text-lg font-bold transition-colors duration-300 ${isOpen ? 'text-[#D8B4FE]' : 'text-[#1a1a1a] group-hover:text-gray-600'}`}>
                    {question}
                </span>
                <span className={`transform transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}>
                    {isOpen ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    )}
                </span>
            </div>
            <div
                className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'
                    }`}
            >
                <p className="text-gray-500 text-[15px] leading-relaxed pr-8">
                    {answer}
                </p>
            </div>
        </div>
    );
};

export default function Landing() {
    return (
        <div className="min-h-screen bg-white text-[#1a1a1a] font-['Plus_Jakarta_Sans'] overflow-x-hidden selection:bg-[#F4EBFF]">

            {/* HEADER */}
            <nav className="max-w-[1440px] mx-auto px-6 md:px-12 py-6 flex items-center justify-between relative z-50 bg-white/80 backdrop-blur-md sticky top-0 border-b border-gray-50/50">
                <div className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L12 22M2 12L22 12M4.92893 4.92893L19.0711 19.0711M4.92893 19.0711L19.0711 4.92893" stroke="#D8B4FE" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <h1 className="text-2xl font-semibold tracking-tight">Vestora</h1>
                </div>

                <div className="hidden lg:flex items-center gap-8 text-[13px] font-semibold text-[#444]">
                    <a href="#explore" className="hover:text-black transition-colors">Explore</a>
                    <a href="#avatar" className="hover:text-black transition-colors">Your Avatar</a>
                    <a href="#ai-guidance" className="hover:text-black transition-colors">AI Guidance</a>
                    <a href="#philosophy" className="hover:text-black transition-colors">Philosophy</a>
                </div>

                <div className="flex items-center gap-4">
                    <a
                        href="mailto:seyeanaep@gmail.com?subject=Vestora%20Platform%20Inquiry"
                        className="hidden md:block text-[13px] font-semibold border border-gray-200 rounded-lg px-5 py-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Contact Us
                    </a>
                    <Link to="/app" className="text-[13px] font-semibold bg-[#1a1a1a] text-white rounded-lg px-5 py-2.5 hover:bg-black transition-colors shadow-lg shadow-black/10">
                        Launch App
                    </Link>
                </div>
            </nav>

            {/* HERO SECTION */}
            <main className="max-w-[1440px] mx-auto px-6 md:px-12 pt-10 pb-32 relative min-h-[85vh] flex flex-col justify-center">
                <FadeIn delay={100}>
                    <div className="absolute top-10 left-6 md:left-12 flex items-center gap-3 border border-gray-100 rounded-full py-1.5 px-2 bg-white z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white"></div>
                            <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                            <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
                        </div>
                        <span className="text-xs font-semibold pr-3 text-gray-600">Trusted by 50+ Ateliers</span>
                    </div>
                </FadeIn>

                <div className="grid lg:grid-cols-3 gap-10 items-center h-full relative z-10 mt-20 lg:mt-0">
                    <div className="flex flex-col items-start z-20">
                        <FadeIn delay={200} direction="left">
                            <h2 className="text-6xl md:text-[5.5rem] font-medium tracking-tight leading-[0.9] text-[#1a1a1a] mb-6">
                                Unlock <br /> your fit's <br /> potential
                            </h2>
                        </FadeIn>
                        <FadeIn delay={300} direction="left">
                            <p className="text-[#666] text-[15px] max-w-[280px] leading-relaxed mb-8 font-medium">
                                Our AI scans your measurements and generates production-ready garments perfectly tailored to you.
                            </p>
                        </FadeIn>
                        <FadeIn delay={400} direction="left">
                            <Link to="/app" className="bg-[#F4EBFF] hover:bg-[#EBDCFF] text-[#3B1E63] font-semibold text-[15px] px-8 py-4 rounded-xl transition-colors">
                                Analyze Fit
                            </Link>
                        </FadeIn>
                    </div>

                    <FadeIn delay={300}>
                        <div className="relative h-[500px] lg:h-[700px] w-full flex justify-center items-center pointer-events-none">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#F4EBFF_0%,transparent_60%)] opacity-40"></div>
                            <div className="relative w-full max-w-sm aspect-[3/4] bg-gradient-to-b from-gray-50 to-white rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden border border-gray-100 flex items-center justify-center">
                                <div className="text-gray-300 font-medium tracking-widest uppercase text-xs">[ 3D Avatar Rendering ]</div>
                                <div className="absolute top-1/4 right-10 w-24 h-24 border border-[#D8B4FE]/40 bg-white/50 backdrop-blur-md flex flex-col justify-between p-3 rounded-lg shadow-sm">
                                    <div className="w-2 h-2 bg-[#D8B4FE] rounded-full"></div>
                                    <span className="text-[9px] text-[#1a1a1a] font-bold uppercase tracking-wider">Shoulders<br />Aligned</span>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <div className="flex flex-col gap-12 items-end text-right z-20">
                        {[
                            { stat: '99%', text: 'accurate digital body alignment' },
                            { stat: '50+', text: 'customizable garment pieces' },
                            { stat: '1-click', text: 'tech pack export for ateliers' }
                        ].map((item, i) => (
                            <FadeIn key={i} delay={400 + i * 100} direction="right">
                                <div>
                                    <div className="flex items-center justify-end gap-3 mb-2">
                                        <span className="text-4xl font-medium tracking-tight text-[#1a1a1a]">{item.stat}</span>
                                    </div>
                                    <p className="text-[13px] text-[#666] font-medium max-w-[140px]">{item.text}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </main>
            {/* MARQUEE SECTION (Бегущая строка) */}
            <section className="relative border-y border-gray-100 bg-white overflow-hidden py-12 flex">
                {/* Градиенты по краям для эффекта растворения */}
                <div className="absolute left-0 top-0 w-32 md:w-64 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 w-32 md:w-64 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                {/* Встроенные стили для бесконечной анимации */}
                <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll {
            animation: scroll 35s linear infinite;
            display: flex;
            width: max-content;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>

                <div className="animate-scroll items-center gap-20 md:gap-32 px-10">
                    {/* Удваиваем список для бесшовной бесконечной прокрутки */}
                    {[...Array(2)].map((_, i) => (
                        <React.Fragment key={i}>
                            <span className="text-2xl font-bold tracking-widest text-gray-300 hover:text-[#1a1a1a] transition-colors duration-300 uppercase font-['Plus_Jakarta_Sans'] cursor-default">Balenciaga</span>
                            <span className="text-3xl font-normal tracking-tighter text-gray-300 hover:text-[#1a1a1a] transition-colors duration-300 font-serif cursor-default">VOGUE</span>
                            <span className="text-2xl font-extrabold tracking-tight text-gray-300 hover:text-[#1a1a1a] transition-colors duration-300 cursor-default">LVMH</span>
                            <span className="text-2xl font-semibold tracking-[0.2em] text-gray-300 hover:text-[#1a1a1a] transition-colors duration-300 uppercase cursor-default">Prada</span>
                            <span className="text-2xl font-bold tracking-widest text-gray-300 hover:text-[#1a1a1a] transition-colors duration-300 cursor-default">CLO<span className="font-light">3D</span></span>
                            <span className="text-3xl font-medium tracking-widest text-gray-300 hover:text-[#1a1a1a] transition-colors duration-300 uppercase font-serif cursor-default">Gucci</span>
                            <span className="text-xl font-bold tracking-tight text-gray-300 hover:text-[#1a1a1a] transition-colors duration-300 uppercase cursor-default">Marvelous</span>
                        </React.Fragment>
                    ))}
                </div>
            </section>

            {/* SECTION: EXPLORE (Garments) */}
            <section id="explore" className="py-24 bg-[#FAFAFA] border-t border-gray-100">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                    <FadeIn>
                        <h3 className="text-3xl font-medium tracking-tight mb-2">Core Collection</h3>
                        <p className="text-[#666] text-sm mb-12">Parametric basics ready for your modifications.</p>
                    </FadeIn>
                    <div className="grid md:grid-cols-3 gap-6">
                        {['T-Shirt', 'Hoodie', 'Jacket'].map((item, i) => (
                            <FadeIn key={i} delay={i * 150}>
                                <div className="group bg-white p-6 rounded-2xl border border-gray-100 hover:border-[#D8B4FE] hover:shadow-[0_10px_40px_rgba(216,180,254,0.15)] transition-all cursor-pointer">
                                    <div className="aspect-[4/3] bg-gray-50 rounded-xl mb-6 flex items-center justify-center text-gray-300 text-xs font-semibold uppercase tracking-widest group-hover:bg-[#F4EBFF]/30 transition-colors">
                                        {item} .glb
                                    </div>
                                    <h4 className="font-semibold text-lg">{item}</h4>
                                    <p className="text-xs text-gray-500 mt-1">Base parametric pattern</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECTION: AVATAR & AI (Split View) */}
            <section id="avatar" className="py-32">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-20 items-center">
                    <FadeIn direction="left">
                        <div className="bg-[#1a1a1a] rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D8B4FE]/10 blur-[60px] rounded-full pointer-events-none"></div>
                            <h3 className="text-2xl font-medium tracking-tight mb-8">Digital Twin Architecture</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-400">Client Profile</span>
                                    <span className="text-sm font-semibold">Ramazan</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-400">Stature</span>
                                    <span className="text-sm font-semibold">185 cm</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-400">Chest Breadth</span>
                                    <span className="text-sm font-semibold">102 cm</span>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <div id="ai-guidance">
                        <FadeIn direction="right">
                            <span className="text-xs font-bold text-[#D8B4FE] mb-3 block uppercase tracking-widest">Generative AI</span>
                            <h3 className="text-4xl font-medium tracking-tight mb-6">Design with natural language.</h3>
                            <p className="text-[#666] text-[15px] leading-relaxed mb-8">
                                Type what you want to see. Our AI agent adjusts the geometric mesh and materials in real-time, translating creative ideas into physical parameters.
                            </p>

                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 relative">
                                <div className="absolute -left-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-[#D8B4FE] rounded-full"></div>
                                </div>
                                <p className="text-sm font-medium text-gray-600 mb-4">"Make the jacket cropped and add an oversized hood."</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#D8B4FE] animate-pulse"></div>
                                    <span className="text-xs font-bold text-[#1a1a1a] uppercase tracking-wider">Processing Mesh...</span>
                                </div>
                            </div>
                        </FadeIn>
                    </div>
                </div>
            </section>

            {/* SECTION: PHILOSOPHY */}
            <section id="philosophy" className="bg-[#FAFAFA] border-t border-gray-100 py-32">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12 flex flex-col lg:flex-row gap-20">
                    <div className="lg:w-1/3">
                        <FadeIn>
                            <h3 className="text-4xl font-medium tracking-tight mb-6">Seamless integration with production.</h3>
                            <p className="text-[#666] text-[15px] leading-relaxed mb-8">
                                We bridge the gap between digital ideation and physical manufacturing. By generating exact specifications instantly, we save weeks of manual drafting.
                            </p>
                        </FadeIn>
                    </div>
                    <div className="lg:w-2/3 grid md:grid-cols-2 gap-x-12 gap-y-16">
                        {[
                            { step: 'Phase 1', title: 'AI Generative Design', desc: 'Modify textures, fit, and proportions using natural language prompts.' },
                            { step: 'Phase 2', title: 'Real-time 3D Fitting', desc: 'Visualize garments on a parametrically adjusted avatar matching exact measurements.' },
                            { step: 'Phase 3', title: 'Tech Pack Generation', desc: 'Export a comprehensive .txt specification sheet ready for any professional atelier.' }
                        ].map((item, i) => (
                            <FadeIn key={i} delay={i * 200}>
                                <div>
                                    <span className="text-xs font-bold text-[#D8B4FE] mb-2 block uppercase tracking-widest">{item.step}</span>
                                    <h4 className="text-xl font-medium mb-3">{item.title}</h4>
                                    <p className="text-[#666] text-sm leading-relaxed">{item.desc}</p>
                                </div>
                            </FadeIn>
                        ))}
                    </div>
                </div>
            </section>
            {/* FAQ SECTION */}
            <section className="bg-white py-32 border-t border-gray-100 relative">
                {/* Декоративное свечение в фоне */}
                <div className="absolute left-[-10%] top-[20%] w-[500px] h-[500px] bg-[#D8B4FE]/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="max-w-[1440px] mx-auto px-6 md:px-12 grid lg:grid-cols-12 gap-16 relative z-10">

                    <div className="lg:col-span-5">
                        <FadeIn direction="left">
                            <span className="text-xs font-bold text-[#D8B4FE] mb-3 block uppercase tracking-widest">Support</span>
                            <h3 className="text-4xl md:text-5xl font-medium tracking-tight mb-6">Frequently <br />asked questions</h3>
                            <p className="text-[#666] text-[15px] leading-relaxed mb-8 max-w-sm">
                                Everything you need to know about the product and how it integrates into your atelier workflow.
                            </p>
                            <button className="text-[13px] font-bold uppercase tracking-widest border-b-2 border-[#1a1a1a] pb-1 hover:text-[#D8B4FE] hover:border-[#D8B4FE] transition-colors">
                                Contact Support
                            </button>
                        </FadeIn>
                    </div>

                    <div className="lg:col-span-7">
                        <FadeIn direction="up">
                            <FaqItem
                                question="What formats can I export for production?"
                                answer="Vestora currently exports highly detailed .txt specification sheets (Tech Packs) containing all parametric measurements and AI-generated modifications, perfectly formatted for pattern makers. We also support .glb export for 3D visualization."
                            />
                            <FaqItem
                                question="How accurate is the 3D avatar sizing?"
                                answer="Our algorithm is millimeter-accurate. By inputting base measurements (Height, Chest, Waist), the system parametrically adjusts the 3D mesh to create an exact digital twin of your client."
                            />
                            <FaqItem
                                question="Can I upload my own custom 3D garments?"
                                answer="The MVP version comes with a core parametric library (T-Shirt, Hoodie, Jacket). Custom .glb uploads and proprietary brand libraries will be unlocked in the upcoming Enterprise tier."
                            />
                            <FaqItem
                                question="How does the AI Assistant work?"
                                answer="Powered by advanced LLMs, the assistant acts as a bridge between natural language and 3D geometry. When you type 'Make it oversized', the AI calculates the necessary scaling vectors and applies them to the garment instantly."
                            />
                        </FadeIn>
                    </div>
                </div>
            </section>
            {/* FINAL CTA SECTION (Темный контрастный блок) */}
            <section className="bg-[#1a1a1a] py-32 text-white relative overflow-hidden">
                {/* Декоративное свечение */}
                <div className="absolute top-[-50%] right-[-10%] w-[800px] h-[800px] bg-[#D8B4FE]/10 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="max-w-[1440px] mx-auto px-6 md:px-12 text-center relative z-10">
                    <FadeIn direction="up">
                        <h2 className="text-5xl md:text-7xl font-medium tracking-tight mb-6">
                            Ready to digitize<br />your workflow?
                        </h2>
                    </FadeIn>
                    <FadeIn delay={100} direction="up">
                        <p className="text-gray-400 max-w-xl mx-auto mb-10 text-[17px] leading-relaxed">
                            Join progressive fashion brands reducing their sampling time by 80% with Vestora's generative AI tools.
                        </p>
                    </FadeIn>
                    <FadeIn delay={200} direction="up">
                        <Link
                            to="/app"
                            className="inline-block bg-[#D8B4FE] hover:bg-[#EBDCFF] text-[#1a1a1a] font-bold text-lg px-12 py-5 rounded-2xl transition-all duration-300 shadow-[0_0_30px_rgba(216,180,254,0.15)] hover:shadow-[0_0_50px_rgba(216,180,254,0.3)] hover:-translate-y-1"
                        >
                            Start Creating Now
                        </Link>
                    </FadeIn>

                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-white pt-20 pb-10 border-t border-gray-100">
                <div className="max-w-[1440px] mx-auto px-6 md:px-12">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">

                        {/* Logo & Info */}
                        <div className="col-span-2 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-6">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L12 22M2 12L22 12M4.92893 4.92893L19.0711 19.0711M4.92893 19.0711L19.0711 4.92893" stroke="#D8B4FE" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                                <h1 className="text-xl font-bold tracking-tight text-[#1a1a1a]">Vestora</h1>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                                The next-generation parametric design platform for digital fashion and automated atelier production.
                            </p>
                        </div>

                        {/* Links Group 1 */}
                        <div>
                            <h4 className="font-bold text-[#1a1a1a] mb-5 text-sm uppercase tracking-widest">Platform</h4>
                            <ul className="space-y-4 text-sm text-gray-500 font-medium">
                                <li><a href="#explore" className="hover:text-[#D8B4FE] transition-colors">Digital Library</a></li>
                                <li><a href="#avatar" className="hover:text-[#D8B4FE] transition-colors">3D Avatar</a></li>
                                <li><a href="#ai-guidance" className="hover:text-[#D8B4FE] transition-colors">AI Assistant</a></li>
                                <li><a href="#" className="hover:text-[#D8B4FE] transition-colors">Tech Packs</a></li>
                            </ul>
                        </div>

                        {/* Links Group 2 */}
                        <div>
                            <h4 className="font-bold text-[#1a1a1a] mb-5 text-sm uppercase tracking-widest">Company</h4>
                            <ul className="space-y-4 text-sm text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-[#D8B4FE] transition-colors">About Us</a></li>
                                <li><a href="#" className="hover:text-[#D8B4FE] transition-colors">Careers</a></li>
                                <li><a href="#" className="hover:text-[#D8B4FE] transition-colors">Contact</a></li>
                                <li><a href="#" className="hover:text-[#D8B4FE] transition-colors">Partners</a></li>
                            </ul>
                        </div>

                        {/* Links Group 3 */}
                        <div>
                            <h4 className="font-bold text-[#1a1a1a] mb-5 text-sm uppercase tracking-widest">Legal</h4>
                            <ul className="space-y-4 text-sm text-gray-500 font-medium">
                                <li><a href="#" className="hover:text-[#D8B4FE] transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-[#D8B4FE] transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-[#D8B4FE] transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm font-medium">
                            © {new Date().getFullYear()} Vestora. All rights reserved.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#D8B4FE] hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#D8B4FE] hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" /></svg>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
}