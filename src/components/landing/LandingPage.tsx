import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import bankHeroImg from '../../assets/images/bank_headquarters_hero_1785496337979.jpg';
import executiveBoardroomImg from '../../assets/images/executive_boardroom_1785496365060.jpg';
import {
  Building2,
  Shield,
  ShieldCheck,
  Lock,
  Send,
  CreditCard,
  Users,
  Globe,
  Award,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Play,
  X,
  FileText,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  Briefcase,
  TrendingUp,
  Sparkles,
  Server,
  UserCheck,
  Smartphone,
  Laptop,
  Tablet,
  Clock,
  Check
} from 'lucide-react';

interface LandingPageProps {
  onLoginClick: () => void;
  onAdminClick: () => void;
  onOpenSupport?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLoginClick,
  onAdminClick,
  onOpenSupport
}) => {
  // Video Showcase Modal State
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const faqs = [
    {
      q: 'How do I access my Nova Trust Bank online account?',
      a: 'Registered clients can access their account 24/7 by clicking "Sign In" at the top of the page. You will need your registered email, 10-digit account number, or username along with your secure password.'
    },
    {
      q: 'What security measures protect my international wire transfers?',
      a: 'Nova Trust Bank employs multi-layered cryptographic protection, including 256-bit SSL encryption, 2-step OTP verification, and secondary administrative authorization passcodes for high-value interbank wires.'
    },
    {
      q: 'How long do cross-border FedWire and SWIFT transfers take?',
      a: 'Internal transfers between Nova Trust accounts are settled instantly. External interbank transfers via FedWire or SWIFT are cleared within 1 to 3 business days depending on receiving institution compliance verification.'
    },
    {
      q: 'What should I do if my account status is marked as Suspended or Under Review?',
      a: 'If your account is suspended for administrative or compliance review, outgoing transfers are temporarily restricted. Please contact our 24/7 Compliance Desk immediately via the Live Support widget or email support@novatrustbank.com.'
    },
    {
      q: 'Are Nova Trust Bank deposits FDIC insured?',
      a: 'Yes, eligible customer deposit accounts are insured up to $250,000 per depositor under applicable banking regulations and FDIC member protection standards.'
    }
  ];

  const services = [
    {
      icon: Building2,
      title: 'Global Corporate & Checking',
      description: 'Multi-currency commercial checking accounts with zero monthly maintenance fees and high-speed settlement.'
    },
    {
      icon: Send,
      title: 'Interbank SWIFT & FedWire',
      description: 'Direct clearing integration with global banking networks in 120+ countries with automated compliance screening.'
    },
    {
      icon: CreditCard,
      title: 'Corporate Debit Cards',
      description: 'Instant virtual card generation, physical card controls, sub-second lock/unlock toggles, and daily limit adjustments.'
    },
    {
      icon: TrendingUp,
      title: 'Wealth & Asset Management',
      description: 'Tailored investment portfolios, high-yield commercial deposits, and dedicated private wealth advisors.'
    },
    {
      icon: ShieldCheck,
      title: 'Institutional Fraud Security',
      description: 'Real-time AI anomaly detection, end-to-end payload encryption, and 24/7 security monitoring desk.'
    },
    {
      icon: Briefcase,
      title: 'Commercial Credit & Financing',
      description: 'Flexible revolving credit facilities, international trade financing, and liquidity management.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0D12] text-[#F1F5F9] font-sans selection:bg-[#D4AF37] selection:text-[#0A0D12]">
      
      {/* ==================== 1. TOP ANNOUNCEMENT & BRAND HEADER ==================== */}
      <div className="bg-[#12161F] text-[#94A3B8] text-[11px] py-2 px-4 border-b border-[#2A3241]">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="bg-[#D4AF37] text-[#0A0D12] font-extrabold px-2 py-0.5 rounded text-[10px] uppercase font-mono tracking-wider shadow-sm">
              SWIFT BIC: NVTBUS33XXX
            </span>
            <span className="hidden md:inline text-gray-300">Member FDIC • Equal Housing Lender • Premier Private &amp; Institutional Banking</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-gray-300">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-[#D4AF37]" />
              <span>+1 (800) 555-NOVA</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#D4AF37]" />
              <span>24/7 Global Concierge Desk</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="bg-[#12161F] text-white sticky top-0 z-40 shadow-2xl border-b border-[#2A3241]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <BrandLogo variant="dark" showTagline={true} />

            {/* Nav Links */}
            <div className="hidden lg:flex items-center gap-8 text-xs font-semibold text-gray-300">
              <a href="#services" className="hover:text-[#D4AF37] transition-colors">Services</a>
              <a href="#about" className="hover:text-[#D4AF37] transition-colors">Corporate History</a>
              <a href="#security" className="hover:text-[#D4AF37] transition-colors">Security &amp; Trust</a>
              <a href="#video" className="hover:text-[#D4AF37] transition-colors">Media Center</a>
              <a href="#faq" className="hover:text-[#D4AF37] transition-colors">FAQ</a>
            </div>

            {/* Auth Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onLoginClick}
                className="bg-gradient-to-r from-[#D4AF37] to-[#B89228] hover:from-[#E5C158] hover:to-[#CBA532] text-[#0A0D12] px-6 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-lg flex items-center gap-2 border border-[#D4AF37]/50"
              >
                <UserCheck className="w-4 h-4 text-[#0A0D12]" />
                <span>Client Access</span>
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ==================== 2. HERO SECTION WITH MULTI-DEVICE SHOWCASE ==================== */}
      <section className="bg-gradient-to-b from-[#0A0D12] via-[#12161F] to-[#0A0D12] text-white py-16 lg:py-24 relative overflow-hidden border-b border-[#2A3241]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Copy */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1A2232] border border-[#D4AF37]/40 text-xs font-semibold text-[#D4AF37] shadow-sm">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                <span>Premier Private Wealth &amp; Commercial Banking</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white font-sans">
                Empowering Global Commercial &amp; Private Leadership
              </h1>

              <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Nova Trust Bank provides institutional-grade cross-border transfers, multi-currency checking accounts, corporate debit controls, and 24/7 dedicated concierge protection for personal and enterprise clients worldwide.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={onLoginClick}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B89228] hover:from-[#E5C158] hover:to-[#CBA532] text-[#0A0D12] px-7 py-3.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all shadow-xl flex items-center gap-2 border border-[#D4AF37]"
                >
                  <span>Access Online Banking</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowVideoModal(true)}
                  className="bg-[#1A2232] hover:bg-[#253046] text-white border border-[#2A3241] px-6 py-3.5 rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-md"
                >
                  <Play className="w-4 h-4 text-[#D4AF37] fill-current" />
                  <span>Watch Corporate Overview</span>
                </button>
              </div>

              {/* Trust Badges Row */}
              <div className="pt-6 border-t border-[#2A3241] grid grid-cols-3 gap-4 text-center lg:text-left text-xs text-gray-300">
                <div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-[#D4AF37]">$45B+</div>
                  <div className="text-[11px] text-gray-400">Assets Under Custody</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-white">120+</div>
                  <div className="text-[11px] text-gray-400">International Markets</div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-white">99.99%</div>
                  <div className="text-[11px] text-gray-400">Uptime &amp; Clearing SLA</div>
                </div>
              </div>
            </div>

            {/* Right Multi-Device Showcase Mockup (1 Laptop, 1 Tablet, 2 Smartphones) */}
            <div className="lg:col-span-6 relative flex items-center justify-center pt-8 lg:pt-0">
              <div className="relative w-full max-w-lg aspect-square flex items-center justify-center p-4">
                
                {/* Real High-Res Bank Headquarters Photography Backdrop */}
                <div className="absolute inset-0 rounded-3xl overflow-hidden border border-white/20 shadow-2xl opacity-40">
                  <img
                    src={bankHeroImg}
                    alt="Nova Trust Bank Headquarters & Financial District"
                    className="w-full h-full object-cover filter brightness-90 saturate-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F3A] via-transparent to-[#0B1F3A]/80"></div>
                </div>

                {/* DEVICE 1: LAPTOP (Center Back) */}
                <div className="absolute top-0 w-[92%] bg-slate-900 rounded-2xl p-2.5 shadow-2xl border border-slate-700/80 transform -rotate-1">
                  <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 text-white p-3 space-y-2">
                    <div className="flex justify-between items-center text-[10px] border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#1E6FB8]" />
                        <span className="font-bold tracking-tight text-white">NOVA TRUST PORTAL</span>
                      </div>
                      <span className="text-emerald-400 font-mono text-[9px] bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        LIVE CLEARED SESSION
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gradient-to-br from-[#0F4C81] to-[#0B1F3A] p-2.5 rounded-lg border border-white/10 space-y-1">
                        <span className="text-[9px] text-gray-300 uppercase tracking-wider font-mono">Available Balance</span>
                        <div className="text-sm font-extrabold font-mono text-white">$148,920.50 USD</div>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                        <span className="text-[9px] text-[#D4AF37] uppercase tracking-wider font-mono">Investment Holdings</span>
                        <div className="text-sm font-extrabold font-mono text-emerald-400">+$32,450.00</div>
                      </div>
                    </div>

                    {/* Chart preview */}
                    <div className="h-14 bg-slate-900/90 rounded-lg border border-slate-800 flex items-end justify-between px-3 py-2 text-[9px] font-mono">
                      <div className="w-2 h-6 bg-[#1E6FB8] rounded-t"></div>
                      <div className="w-2 h-9 bg-[#1E6FB8] rounded-t"></div>
                      <div className="w-2 h-7 bg-[#1E6FB8] rounded-t"></div>
                      <div className="w-2 h-11 bg-[#D4AF37] rounded-t"></div>
                      <div className="w-2 h-8 bg-[#1E6FB8] rounded-t"></div>
                      <div className="w-2 h-12 bg-emerald-500 rounded-t"></div>
                    </div>
                  </div>
                  {/* Laptop Base */}
                  <div className="w-full h-3 bg-slate-800 rounded-b-xl mt-1 flex justify-center items-center">
                    <div className="w-12 h-1 bg-slate-600 rounded-full"></div>
                  </div>
                </div>

                {/* DEVICE 2: TABLET (Left Side Overlay) */}
                <div className="absolute left-[-2%] bottom-10 w-[55%] bg-slate-900 rounded-2xl p-2 shadow-2xl border border-slate-700 transform -rotate-6 z-20">
                  <div className="bg-white text-[#172B4D] rounded-xl p-3 space-y-2 text-[10px]">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-1.5">
                      <span className="font-bold text-[#0B1F3A]">Interbank Wire</span>
                      <span className="text-[8px] bg-blue-50 text-[#0F4C81] font-bold px-1.5 py-0.5 rounded">SWIFT</span>
                    </div>
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Recipient:</span>
                        <span className="font-bold text-[#0B1F3A]">Acme Global Corp</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-bold text-emerald-700">$25,000.00</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DEVICE 3: SMARTPHONE 1 (Front Right Overlay) */}
                <div className="absolute right-[-4%] bottom-4 w-[42%] bg-slate-950 rounded-3xl p-2 shadow-2xl border-2 border-slate-700 transform rotate-3 z-30">
                  <div className="bg-[#0B1F3A] text-white rounded-2xl p-3 space-y-2.5">
                    <div className="w-8 h-1 bg-slate-600 rounded-full mx-auto"></div>
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-2.5 rounded-xl border border-white/10 space-y-2 font-mono">
                      <div className="flex justify-between text-[8px] text-[#D4AF37]">
                        <span>PREMIER CORPORATE</span>
                        <span>VISA</span>
                      </div>
                      <div className="text-[10px] font-bold tracking-widest text-white">•••• 8829</div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] bg-white/5 p-2 rounded-lg border border-white/10">
                      <span className="text-gray-300">Card Lock</span>
                      <span className="text-emerald-400 font-bold">SECURE</span>
                    </div>
                  </div>
                </div>

                {/* DEVICE 4: SMARTPHONE 2 (Front Center Low Overlay) */}
                <div className="absolute left-[20%] bottom-[-10px] w-[38%] bg-slate-900 rounded-3xl p-2 shadow-2xl border border-slate-600 transform -rotate-2 z-40">
                  <div className="bg-white text-[#172B4D] rounded-2xl p-2.5 space-y-1.5 text-[9px]">
                    <div className="w-8 h-1 bg-gray-300 rounded-full mx-auto"></div>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded-lg">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>2-Step MFA Cleared</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================== 3. CORPORATE HISTORY, MISSION & VISION ==================== */}
      <section id="about" className="py-20 bg-[#0A0D12] border-b border-[#2A3241]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
              ESTABLISHED IN 1984
            </span>
            <h2 className="text-3xl font-bold text-[#F1F5F9]">
              Four Decades of Institutional Financial Excellence
            </h2>
            <p className="text-sm text-[#94A3B8]">
              Founded with a mandate to deliver resilient, transparent, and secure financial management, Nova Trust Bank has grown into a premier partner for multinational corporations, institutional investors, and discerning private clients worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-[#12161F] rounded-2xl border border-[#2A3241] space-y-3 shadow-lg">
              <div className="w-12 h-12 bg-[#1A2232] text-[#D4AF37] rounded-xl flex items-center justify-center font-bold text-lg border border-[#2A3241]">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#F1F5F9]">Global Network</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Headquartered in New York with clearing hubs in London, Frankfurt, Singapore, and Tokyo to facilitate seamless 24-hour liquidity settlement.
              </p>
            </div>

            <div className="p-6 bg-[#12161F] rounded-2xl border border-[#2A3241] space-y-3 shadow-lg">
              <div className="w-12 h-12 bg-[#1A2232] text-[#D4AF37] rounded-xl flex items-center justify-center font-bold text-lg border border-[#2A3241]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#F1F5F9]">Mission &amp; Capital Solvency</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Operating under rigorous Tier-1 capital ratios exceeding Basel III requirements, ensuring your deposits remain fully collateralized and protected.
              </p>
            </div>

            <div className="p-6 bg-[#12161F] rounded-2xl border border-[#2A3241] space-y-3 shadow-lg">
              <div className="w-12 h-12 bg-[#1A2232] text-[#D4AF37] rounded-xl flex items-center justify-center font-bold text-lg border border-[#2A3241]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-[#F1F5F9]">Strategic Vision</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Pioneering institutional digital banking infrastructure with cryptographic security, instant card management, and 24/7 dedicated concierge protection.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ==================== 4. COMMERCIAL SERVICES GRID ==================== */}
      <section id="services" className="py-20 bg-[#12161F] border-b border-[#2A3241]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
              COMPREHENSIVE FINANCIAL SOLUTIONS
            </span>
            <h2 className="text-3xl font-bold text-[#F1F5F9]">
              Tailored Commercial &amp; Private Banking Services
            </h2>
            <p className="text-sm text-[#94A3B8]">
              Engineered for velocity, safety, and operational simplicity across all digital platforms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#0A0D12] p-6 rounded-2xl border border-[#2A3241] shadow-lg hover:border-[#D4AF37]/60 transition-all group space-y-3"
                >
                  <div className="w-10 h-10 bg-[#1A2232] text-[#D4AF37] rounded-xl flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-[#0A0D12] transition-colors border border-[#2A3241]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-base text-[#F1F5F9] group-hover:text-[#D4AF37] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ==================== 5. BANK SECURITY & COMPLIANCE ==================== */}
      <section id="security" className="py-20 bg-[#0A0D12] text-white border-b border-[#2A3241]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
                MILITARY-GRADE BANK SECURITY
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Uncompromising Cryptographic &amp; Compliance Protection
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                At Nova Trust Bank, security is woven into every transaction. We implement multi-factor authentication, end-to-end payload encryption, and continuous transaction auditing to safeguard client assets.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">256-Bit SSL/TLS Encryption</strong>
                    <span className="text-gray-400">All banking communication traffic is protected by TLS 1.3 cryptographic protocols.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Two-Step Verification &amp; OTP Passcodes</strong>
                    <span className="text-gray-400">Required primary OTP codes and secondary authorization passcodes for wire transfers.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block font-semibold">Real-Time Fraud &amp; AML Screening</strong>
                    <span className="text-gray-400">Automated compliance checks prevent unauthorized access and protect account integrity.</span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={onLoginClick}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B89228] hover:from-[#E5C158] hover:to-[#CBA532] text-[#0A0D12] px-6 py-3 rounded-xl font-extrabold text-xs transition-colors shadow-lg border border-[#D4AF37]"
                >
                  Sign In to Secure Portal
                </button>
              </div>
            </div>

            <div className="bg-[#12161F] p-8 rounded-3xl border border-[#2A3241] shadow-2xl space-y-6 text-xs">
              <div className="flex items-center gap-3 border-b border-[#2A3241] pb-4">
                <Server className="w-8 h-8 text-[#D4AF37]" />
                <div>
                  <h3 className="font-bold text-sm text-white">Nova Trust Security Core</h3>
                  <p className="text-[11px] text-gray-400">Operational Status: All Systems Optimal</p>
                </div>
              </div>

              <div className="space-y-3 font-mono">
                <div className="flex justify-between p-3 bg-[#0A0D12] rounded-xl border border-[#2A3241]">
                  <span className="text-gray-400">Clearing Network:</span>
                  <span className="text-emerald-400 font-bold">ONLINE (SWIFT/FedWire)</span>
                </div>
                <div className="flex justify-between p-3 bg-[#0A0D12] rounded-xl border border-[#2A3241]">
                  <span className="text-gray-400">Encryption Layer:</span>
                  <span className="text-emerald-400 font-bold">AES-256-GCM Active</span>
                </div>
                <div className="flex justify-between p-3 bg-[#0A0D12] rounded-xl border border-[#2A3241]">
                  <span className="text-gray-400">MFA Verification:</span>
                  <span className="text-[#D4AF37] font-bold">Enforced (OTP + Code)</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ==================== 6. PREMIUM HOMEPAGE VIDEO SECTION ==================== */}
      <section id="video" className="py-20 bg-[#12161F] border-b border-[#2A3241]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
              CORPORATE MEDIA &amp; INSIGHTS
            </span>
            <h2 className="text-3xl font-bold text-[#F1F5F9]">
              Experience Nova Trust Bank
            </h2>
            <p className="text-sm text-[#94A3B8]">
              Discover secure, modern, and trusted digital banking.
            </p>
          </div>

          {/* Video Player & Poster Container */}
          <div className="max-w-4xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl border border-[#2A3241] bg-[#0A0D12] aspect-video flex items-center justify-center group">
            {!videoError ? (
              <video
                src="/videos/promo.mp4"
                autoPlay
                muted
                loop
                playsInline
                onError={() => setVideoError(true)}
                className="w-full h-full object-cover rounded-3xl shadow-xl"
              />
            ) : (
              <>
                {/* Visual Background Poster Photo Fallback */}
                <img
                  src={executiveBoardroomImg}
                  alt="Nova Trust Executive Boardroom"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-black/60 to-black/80 z-10"></div>
                
                <div className="relative z-20 text-center space-y-4 px-6">
                  <button
                    onClick={() => {
                      setShowVideoModal(true);
                      setIsPlayingVideo(true);
                    }}
                    className="w-20 h-20 bg-gradient-to-r from-[#D4AF37] to-[#B89228] hover:scale-110 text-[#0A0D12] rounded-full flex items-center justify-center shadow-2xl transition-transform mx-auto border-4 border-[#D4AF37]/50"
                    title="Play Corporate Video"
                  >
                    <Play className="w-8 h-8 fill-current translate-x-0.5 text-[#0A0D12]" />
                  </button>

                  <div>
                    <h3 className="text-xl font-bold text-white">Nova Trust Bank Operational Overview</h3>
                    <p className="text-xs text-[#D4AF37] mt-1 font-mono">Discover Secure, Modern, and Trusted Digital Banking</p>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </section>

      {/* ==================== 7. INTERACTIVE FAQ ACCORDION ==================== */}
      <section id="faq" className="py-20 bg-[#0A0D12] border-b border-[#2A3241]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] font-mono">
              CLIENT ASSISTANCE
            </span>
            <h2 className="text-3xl font-bold text-[#F1F5F9]">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-[#94A3B8]">
              Common queries regarding online access, transfer security, and account verification.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-[#12161F] rounded-2xl border border-[#2A3241] overflow-hidden shadow-lg transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left font-bold text-sm text-[#F1F5F9] flex items-center justify-between gap-4 hover:bg-[#1A2232]"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-[#D4AF37]" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-[#94A3B8] leading-relaxed border-t border-[#2A3241] pt-3 bg-[#0A0D12]">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ==================== 8. FOOTER WITH HIDDEN ACCESS DOT ==================== */}
      <footer className="bg-[#12161F] text-white pt-16 pb-12 border-t border-[#2A3241]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-xs">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-[#D4AF37] to-[#B89228] rounded-lg flex items-center justify-center text-[#0A0D12]">
                  <Building2 className="w-5 h-5 text-[#0A0D12]" />
                </div>
                <span className="font-bold text-base text-white">NOVA TRUST BANK</span>
              </div>
              <p className="text-gray-300 leading-relaxed text-[11px]">
                Premier commercial and private international banking institution providing secure digital accounts, SWIFT clearing, and asset custody worldwide.
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#D4AF37] text-xs uppercase tracking-wider font-mono">Banking Services</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#services" className="hover:text-[#D4AF37]">Commercial Checking</a></li>
                <li><a href="#services" className="hover:text-[#D4AF37]">FedWire / SWIFT Transfers</a></li>
                <li><a href="#services" className="hover:text-[#D4AF37]">Corporate Debit Cards</a></li>
                <li><a href="#services" className="hover:text-[#D4AF37]">Wealth &amp; Investment</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#D4AF37] text-xs uppercase tracking-wider font-mono">Regulatory &amp; Legal</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#security" className="hover:text-[#D4AF37]">FDIC Coverage Info</a></li>
                <li><a href="#security" className="hover:text-[#D4AF37]">Privacy Policy</a></li>
                <li><a href="#security" className="hover:text-[#D4AF37]">Terms of Service</a></li>
                <li><a href="#faq" className="hover:text-[#D4AF37]">Compliance Desk</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-[#D4AF37] text-xs uppercase tracking-wider font-mono">Headquarters &amp; Hours</h4>
              <div className="space-y-2 text-gray-300 text-[11px]">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>256 Financial Plaza, New York, NY 10005</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>+1 (800) 555-NOVA</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>support@novatrustbank.com</span>
                </p>
                <p className="flex items-center gap-1.5 pt-1">
                  <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Mon–Fri: 8:00 AM – 8:00 PM EST</span>
                </p>
              </div>
            </div>

          </div>

          {/* Footer Bottom Bar with Hidden Admin Circular Access Dot */}
          <div className="pt-8 border-t border-[#2A3241] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-400">
            <div className="flex items-center gap-1">
              <span>© 1984–2026 Nova Trust Bank, N.A. All Rights Reserved. Member FDIC. Equal Housing Lender.</span>
              
              {/* HIDDEN FOOTER ACCESS DOT (Requirement 8) */}
              <button
                onClick={onAdminClick}
                className="w-1.5 h-1.5 rounded-full bg-slate-700 hover:bg-slate-500 inline-block transition-colors cursor-pointer border-none p-0 ml-2"
                aria-label="System Node"
                title=""
              />
            </div>

            <div className="flex items-center gap-6">
              <span>SWIFT: NVTBUS33XXX</span>
              <span>TLS 1.3 256-Bit Cryptography</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ==================== 9. VIDEO MODAL PLAYER ==================== */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12161F] rounded-3xl max-w-3xl w-full p-6 text-white border border-[#2A3241] shadow-2xl relative space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#2A3241] pb-3">
              <div className="flex items-center gap-2">
                <Play className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-bold text-sm text-white">Nova Trust Institutional Presentation</h3>
              </div>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setIsPlayingVideo(false);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Video Player Display */}
            <div className="bg-black rounded-2xl aspect-video relative flex flex-col items-center justify-center p-6 text-center border border-[#2A3241] overflow-hidden">
              {isPlayingVideo ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full border-4 border-[#1A2232] border-t-[#D4AF37] animate-spin mx-auto"></div>
                  <p className="text-xs text-gray-300 font-mono">Streaming High-Definition Corporate Media Feed...</p>
                  <div className="p-4 bg-[#0A0D12] rounded-xl border border-[#2A3241] text-left max-w-md mx-auto text-xs space-y-1">
                    <p className="font-bold text-[#D4AF37]">Presentation Highlights:</p>
                    <p className="text-gray-300">• Tier-1 Capital Reserves &amp; Regulatory Solvency</p>
                    <p className="text-gray-300">• Automated SWIFT &amp; FedWire Clearing Engine</p>
                    <p className="text-gray-300">• Multi-Factor Cryptographic Customer Security</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => setIsPlayingVideo(true)}
                    className="p-4 bg-gradient-to-r from-[#D4AF37] to-[#B89228] text-[#0A0D12] rounded-full mx-auto shadow-xl hover:scale-105 transition-transform"
                  >
                    <Play className="w-8 h-8 fill-current text-[#0A0D12]" />
                  </button>
                  <p className="text-xs text-gray-400">Click Play to begin video presentation</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center text-xs text-gray-300 pt-2">
              <span>Nova Trust Media Network</span>
              <button
                onClick={() => setShowVideoModal(false)}
                className="px-4 py-2 bg-[#1A2232] hover:bg-[#253046] border border-[#2A3241] rounded-xl font-bold text-white"
              >
                Close Media Player
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
