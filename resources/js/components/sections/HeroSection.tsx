// components/sections/HeroSection.tsx
import React from 'react';

const HeroSection: React.FC = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="pt-16 sm:pt-20 md:pt-24 text-white relative overflow-hidden min-h-screen"
      style={{
        backgroundImage: 'url("herosection/smilingface.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Enhanced Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-slate-800/70 to-slate-700/50"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full">
        <div className="flex flex-col min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-5rem)] md:min-h-[calc(100vh-6rem)]">
          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center pt-8 sm:pt-12 md:pt-16 pb-48 sm:pb-44 md:pb-40">
            <div className="max-w-3xl space-y-6 sm:space-y-8">
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white">
                Dental Care For<br />
                Your <span className="text-teal-400 font-bold">NEW</span><br />
                <span className="text-teal-400 font-bold">SMILE.</span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-2xl leading-relaxed">
                Experience exceptional dental care with our state-of-the-art technology and compassionate team. Your perfect smile awaits.
              </p>
              
              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-6 sm:pt-8">
                <button 
                  onClick={() => scrollToSection('contact')} 
                  className="px-8 py-4 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl"
                >
                  Book Appointment
                </button>
                <button 
                  onClick={() => scrollToSection('services')} 
                  className="px-8 py-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/30 rounded-xl font-semibold text-lg transition-all duration-300"
                >
                  Learn More
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom Cards */}
          <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 left-0 right-0 z-30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Working Hours Card */}
                <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-black/70 transition-all duration-300 shadow-2xl">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-teal-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-2">Working Hours</h3>
                      <div className="text-sm text-white/90 space-y-1">
                        <p>Mon-Sat</p>
                        <p>9:00am-3:00pm</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Book Appointment Card */}
                <div 
                  onClick={() => scrollToSection('contact')} 
                  className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-black/70 transition-all duration-300 cursor-pointer shadow-2xl sm:col-span-2 lg:col-span-1 group"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-teal-500/30 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-teal-500/40 transition-colors">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">Book an Appointment</h3>
                      <p className="text-sm text-white/80 mt-1">Schedule your visit today</p>
                    </div>
                  </div>
                </div>
                
                {/* Emergency Service Card */}
                <div className="bg-black/60 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-black/70 transition-all duration-300 shadow-2xl sm:col-span-2 lg:col-span-1">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-red-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">Emergency Service</h3>
                      <p className="text-sm text-white/80 mt-1">24/7 urgent care</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;