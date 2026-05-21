import { useState } from 'react';

export default function SplashLoading() {
  const welcomeMessage = "आपका स्वागत है आपके अपने मार्ट में";

  const [particles] = useState(() => [...Array(6)].map((_, i) => (
    <div 
      key={i}
      className="absolute text-lg opacity-20 animate-[leaf-float_15s_linear_infinite]"
      style={{ 
        top: `${Math.random() * 100}%`, 
        left: `${Math.random() * 100}%`,
        animationDelay: `${-Math.random() * 15}s`
      }}
    >
      🍃
    </div>
  )));

  return (
    <div className="fixed inset-0 bg-[#05110c] flex flex-col items-center justify-center z-[9999] overflow-hidden font-sans">
      
      {/* Premium Dynamic Mesh Background with Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[10%] w-[300px] h-[300px] bg-[#1CA672] rounded-full blur-[80px] opacity-20 animate-[orb-move_12s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-[#0a4d35] rounded-full blur-[80px] opacity-20 animate-[orb-move_15s_ease-in-out_infinite_reverse]" />
        
        {particles}
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#05110c_90%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-8">
        
        {/* Central Logo Container */}
        <div className="relative mb-12">
          <div className="relative w-32 h-32 bg-gradient-to-br from-[#1CA672] to-[#0a4d35] rounded-[2.5rem] p-5 shadow-[0_20px_50px_rgba(28,166,114,0.3)] flex items-center justify-center border border-white/10 animate-[float_4s_ease-in-out_infinite]">
             <img 
              src="/pwa-512x512.png" 
              alt="G Mart" 
              className="w-full h-full object-contain filter drop-shadow-[0_5px_15px_rgba(255,255,255,0.4)]"
            />
          </div>
        </div>

        {/* Stacked Layout exactly as screenshot */}
        <h1 className="text-white text-4xl md:text-5xl font-black tracking-[0.15em] mb-4">
          राम राम जी
        </h1>
        
        <div className="flex flex-col items-center gap-6">
          <div className="h-1 w-16 bg-[#1CA672] rounded-full" />
          <p className="text-white font-bold text-lg md:text-xl leading-relaxed max-w-[300px]">
            {welcomeMessage}
          </p>
        </div>
      </div>

      {/* Bottom Status Bar exactly as screenshot */}
      <div className="absolute bottom-12 w-full flex justify-center px-8">
        <div className="bg-white/5 border border-white/10 rounded-full px-7 py-3.5 flex items-center gap-3 backdrop-blur-md">
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1CA672]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#1CA672]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#1CA672] opacity-40" />
          </div>
          <span className="text-white/60 text-[10px] font-bold tracking-[0.12em]">
            शुद्धता और ताज़गी, सीधे आपके घर...
          </span>
        </div>
      </div>

      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-15px) rotate(2deg); } }
        @keyframes orb-move { 
          0%,100% { transform: translate(0,0); } 
          33% { transform: translate(30px, -50px); } 
          66% { transform: translate(-20px, 40px); } 
        }
        @keyframes leaf-float { 
          0% { transform: translate(0,0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translate(100px, 100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
