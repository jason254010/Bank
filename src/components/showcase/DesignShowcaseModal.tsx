import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, ZoomIn, Eye, Shield, Building2, Palette, Layers, Award } from 'lucide-react';

interface DesignShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConcept?: (conceptName: string) => void;
}

export const DesignShowcaseModal: React.FC<DesignShowcaseModalProps> = ({
  isOpen,
  onClose,
  onSelectConcept
}) => {
  const [activeTab, setActiveTab] = useState<'UI_CONCEPTS' | 'LOGOS' | 'BRANDING'>('UI_CONCEPTS');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!isOpen) return null;

  const uiConcepts = [
    {
      id: 1,
      title: "Concept 1: Executive Navy",
      desc: "Deep corporate navy palette with gold accents, refined typography, and high-contrast data visualization.",
      features: ["Homepage", "Customer Dashboard", "Login Page", "Mobile App", "Administrator Dashboard"]
    },
    {
      id: 2,
      title: "Concept 2: Modern Commercial Banking",
      desc: "Crisp architectural white layout, dark slate headers, and dense tabular SWIFT transfer queue.",
      features: ["Multi-Currency Accounts", "Interbank Wires", "Cards Management", "Live Audit Logs"]
    },
    {
      id: 3,
      title: "Concept 3: Luxury White & Gold",
      desc: "Private wealth prestige styling with champagne gold borders, serif headings, and concierge status.",
      features: ["Private Banking Portal", "Asset Custody", "Priority Wire Desk", "VIP Concierge"]
    },
    {
      id: 4,
      title: "Concept 4: Platinum Silver",
      desc: "Ultra-clean platinum metallic theme engineered for institutional corporate management.",
      features: ["Corporate Liquidity", "Treasury Desk", "Sub-account Controls", "Role Management"]
    },
    {
      id: 5,
      title: "Concept 5: Scandinavian Banking",
      desc: "Minimalist Nordic aesthetic with light slate, ocean teal indicators, and spacious line heights.",
      features: ["Streamlined UI", "Clean Typography", "Focused Analytics", "Instant Transfers"]
    },
    {
      id: 6,
      title: "Concept 6: Sapphire Banking",
      desc: "Rich sapphire blue dark mode with glassmorphic cards and glowing status metrics.",
      features: ["Night Mode Portal", "Real-Time Telemetry", "Cryptographic Badges", "Global FX Engine"]
    },
    {
      id: 7,
      title: "Concept 7: Graphite Executive",
      desc: "Obsidian dark theme with metallic silver accents and high-density financial metrics.",
      features: ["Enterprise Terminal", "Institutional FX", "Advanced Reporting", "Security Monitoring"]
    },
    {
      id: 8,
      title: "Concept 8: Premium International Banking",
      desc: "Global commercial layout with dual-code transfer verification queue and live compliance monitoring.",
      features: ["FedWire / SWIFT Clearing", "Dual OTP Security", "Suspended Notice Flow", "Staff Admin Control"]
    }
  ];

  const logoList = [
    { num: 1, name: "Premium Shield", style: "Gold Accented Shield", icon: "🛡️" },
    { num: 2, name: "Monogram N", style: "Geometric Interlocking N", icon: "🇳" },
    { num: 3, name: "Monogram NT", style: "Heraldic N + T Combination", icon: "🏛️" },
    { num: 4, name: "Globe & Shield", style: "International Protection Crest", icon: "🌐" },
    { num: 5, name: "Heraldic Eagle", style: "Institutional Power Mark", icon: "🦅" },
    { num: 6, name: "Regal Lion", style: "Private Banking Crest", icon: "🦁" },
    { num: 7, name: "Financial Symbol", style: "Modern Geometric Hexagon", icon: "💎" },
    { num: 8, name: "Vault Lock", style: "Cryptographic Security Wheel", icon: "🔐" },
    { num: 9, name: "Crown Wealth", style: "Private Heritage Crown", icon: "👑" },
    { num: 10, name: "Abstract Banking", style: "Symmetrical Node Ring", icon: "✨" },
    { num: 11, name: "Premium Wordmark", style: "Classic High-Contrast Serif", icon: "✍️" },
    { num: 12, name: "Minimal Luxury", style: "Ultra-Sleek Modern Mark", icon: "⚡" }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-[#0B1F3A] text-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col border border-white/20 shadow-2xl overflow-hidden my-auto">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-[#09182E]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0F4C81] text-[#D4AF37] rounded-2xl flex items-center justify-center shadow-md border border-white/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-white font-sans">
                  NOVA TRUST BANK
                </h2>
                <span className="bg-[#D4AF37] text-[#0B1F3A] text-[10px] font-extrabold px-2 py-0.5 rounded font-mono uppercase">
                  Design & Logo Showcase
                </span>
              </div>
              <p className="text-xs text-gray-300">
                Compare 8 Premium UI Design Concepts &amp; 12 Professional International Banking Logo Marks
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2.5 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              title="Close Showcase"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Showcase Category Selector Tabs */}
        <div className="flex border-b border-white/10 bg-[#0B1F3A] px-6 pt-3 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('UI_CONCEPTS')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'UI_CONCEPTS'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>8 UI Design Concepts (High-Res Render)</span>
          </button>

          <button
            onClick={() => setActiveTab('LOGOS')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'LOGOS'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>12 Logo Concepts Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('BRANDING')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'BRANDING'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Full Ecosystem Branding Preview</span>
          </button>
        </div>

        {/* Main Scrollable Content Area */}
        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-[#09182E]">
          
          {/* TAB 1: 8 UI CONCEPTS */}
          {activeTab === 'UI_CONCEPTS' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="bg-[#0F4C81]/30 p-4 rounded-2xl border border-[#0F4C81] text-xs space-y-1">
                <span className="font-bold text-[#D4AF37] block">✦ 8 Premium Banking Design Concepts Rendered:</span>
                <p className="text-gray-200">
                  Each concept includes high-resolution previews for the Public Homepage, Customer Login, Customer Dashboard, Account Overview, Interbank Wire Transfers, Cards Management, Administrator Dashboard, Mobile App, Tablet View, and Desktop View.
                </p>
              </div>

              {/* Render Image Board 1 (Concepts 1 - 4) */}
              <div className="bg-[#0B1F3A] p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Concepts 1–4: Executive &amp; Luxury Commercial UI Suite</h3>
                    <p className="text-xs text-[#D4AF37] font-mono">Executive Navy • Commercial Banking • Luxury White &amp; Gold • Platinum Silver</p>
                  </div>
                  <button
                    onClick={() => setSelectedImage('/showcase/ui_concepts_1.jpg')}
                    className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#0C3C66] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10"
                  >
                    <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
                    <span>View Full Size</span>
                  </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer" onClick={() => setSelectedImage('/showcase/ui_concepts_1.jpg')}>
                  <img
                    src="/showcase/ui_concepts_1.jpg"
                    alt="Nova Trust Bank UI Concepts 1 to 4"
                    className="w-full h-auto object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm gap-2">
                    <Eye className="w-5 h-5 text-[#D4AF37]" />
                    <span>Click to Zoom High-Res Render</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {uiConcepts.slice(0, 4).map((c) => (
                    <div key={c.id} className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                      <div className="font-bold text-[#D4AF37] text-xs">{c.title}</div>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{c.desc}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.features.map((f, idx) => (
                          <span key={idx} className="bg-white/10 text-gray-200 text-[9px] px-2 py-0.5 rounded font-mono">
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Render Image Board 2 (Concepts 5 - 8) */}
              <div className="bg-[#0B1F3A] p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-white">Concepts 5–8: Modern International &amp; Dark Executive Suite</h3>
                    <p className="text-xs text-[#D4AF37] font-mono">Scandinavian Minimal • Sapphire Night • Graphite Executive • International SWIFT</p>
                  </div>
                  <button
                    onClick={() => setSelectedImage('/showcase/ui_concepts_2.jpg')}
                    className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#0C3C66] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10"
                  >
                    <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
                    <span>View Full Size</span>
                  </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer" onClick={() => setSelectedImage('/showcase/ui_concepts_2.jpg')}>
                  <img
                    src="/showcase/ui_concepts_2.jpg"
                    alt="Nova Trust Bank UI Concepts 5 to 8"
                    className="w-full h-auto object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm gap-2">
                    <Eye className="w-5 h-5 text-[#D4AF37]" />
                    <span>Click to Zoom High-Res Render</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {uiConcepts.slice(4, 8).map((c) => (
                    <div key={c.id} className="p-3.5 bg-white/5 rounded-xl border border-white/10 space-y-2">
                      <div className="font-bold text-[#D4AF37] text-xs">{c.title}</div>
                      <p className="text-[11px] text-gray-300 leading-relaxed">{c.desc}</p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.features.map((f, idx) => (
                          <span key={idx} className="bg-white/10 text-gray-200 text-[9px] px-2 py-0.5 rounded font-mono">
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: 12 LOGO CONCEPTS */}
          {activeTab === 'LOGOS' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="bg-[#0F4C81]/30 p-4 rounded-2xl border border-[#0F4C81] text-xs space-y-1">
                <span className="font-bold text-[#D4AF37] block">✦ 12 Professional Logo Concepts for Nova Trust Bank:</span>
                <p className="text-gray-200">
                  Each logo design is presented across Light Background, Dark Background, Website Header, Mobile App Icon, and Embossed Corporate Debit Card.
                </p>
              </div>

              {/* Logo Board 1 (Logos 1-6) */}
              <div className="bg-[#0B1F3A] p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">Logos 1–6: Heritage &amp; Emblematic Suite</h3>
                  <button
                    onClick={() => setSelectedImage('/showcase/logo_concepts_1.jpg')}
                    className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#0C3C66] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10"
                  >
                    <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
                    <span>View Full Size</span>
                  </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer" onClick={() => setSelectedImage('/showcase/logo_concepts_1.jpg')}>
                  <img
                    src="/showcase/logo_concepts_1.jpg"
                    alt="Nova Trust Bank Logos 1 to 6"
                    className="w-full h-auto object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm gap-2">
                    <Eye className="w-5 h-5 text-[#D4AF37]" />
                    <span>Click to Zoom High-Res Logos</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  {logoList.slice(0, 6).map((l) => (
                    <div key={l.num} className="p-3 bg-white/5 rounded-xl border border-white/10 text-center space-y-1">
                      <div className="text-2xl">{l.icon}</div>
                      <div className="font-bold text-[#D4AF37] text-[11px]">{l.num}. {l.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{l.style}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logo Board 2 (Logos 7-12) */}
              <div className="bg-[#0B1F3A] p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">Logos 7–12: Modern Geometric &amp; Minimal Suite</h3>
                  <button
                    onClick={() => setSelectedImage('/showcase/logo_concepts_2.jpg')}
                    className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#0C3C66] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10"
                  >
                    <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
                    <span>View Full Size</span>
                  </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer" onClick={() => setSelectedImage('/showcase/logo_concepts_2.jpg')}>
                  <img
                    src="/showcase/logo_concepts_2.jpg"
                    alt="Nova Trust Bank Logos 7 to 12"
                    className="w-full h-auto object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm gap-2">
                    <Eye className="w-5 h-5 text-[#D4AF37]" />
                    <span>Click to Zoom High-Res Logos</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                  {logoList.slice(6, 12).map((l) => (
                    <div key={l.num} className="p-3 bg-white/5 rounded-xl border border-white/10 text-center space-y-1">
                      <div className="text-2xl">{l.icon}</div>
                      <div className="font-bold text-[#D4AF37] text-[11px]">{l.num}. {l.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{l.style}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: COMPLETE ECOSYSTEM BRANDING PREVIEW */}
          {activeTab === 'BRANDING' && (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="bg-[#0F4C81]/30 p-4 rounded-2xl border border-[#0F4C81] text-xs space-y-1">
                <span className="font-bold text-[#D4AF37] block">✦ Complete Ecosystem Branding Integration Preview:</span>
                <p className="text-gray-200">
                  Illustrating unified application branding across Homepage, Customer Dashboard, Administrator Approval Desk, Debit Card, Credit Card, Mobile Banking iPhone App, Header, and Login Page.
                </p>
              </div>

              <div className="bg-[#0B1F3A] p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-white">Full Application Ecosystem Visual Master</h3>
                  <button
                    onClick={() => setSelectedImage('/showcase/branding_preview.jpg')}
                    className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#0C3C66] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/10"
                  >
                    <ZoomIn className="w-4 h-4 text-[#D4AF37]" />
                    <span>View Full Size</span>
                  </button>
                </div>

                <div className="relative rounded-2xl overflow-hidden border border-white/10 group cursor-pointer" onClick={() => setSelectedImage('/showcase/branding_preview.jpg')}>
                  <img
                    src="/showcase/branding_preview.jpg"
                    alt="Nova Trust Bank Ecosystem Branding Preview"
                    className="w-full h-auto object-cover rounded-2xl transition-transform duration-300 group-hover:scale-[1.01]"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm gap-2">
                    <Eye className="w-5 h-5 text-[#D4AF37]" />
                    <span>Click to Zoom Ecosystem Render</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#09182E] border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-300">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>All 8 UI Concepts &amp; 12 Logo Marks Ready for Instant Application</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0F4C81] hover:bg-[#0C3C66] text-white font-bold rounded-xl transition-colors border border-white/10"
          >
            Close &amp; Return to Banking App
          </button>
        </div>

      </div>

      {/* LIGHTBOX MODAL FOR FULL-SIZE ZOOM */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <div className="relative max-w-7xl w-full max-h-[95vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-white/20 hover:bg-white/40 p-2.5 rounded-full z-50"
            >
              <X className="w-7 h-7" />
            </button>
            <img
              src={selectedImage}
              alt="High Res Render"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};
