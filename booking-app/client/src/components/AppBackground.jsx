export default function AppBackground({ children }) {
  return (
    <div className="relative min-h-[100dvh] bg-gray-50 overflow-hidden">
      
      {/* blobs background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl animate-float" />
        
        <div className="absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-sky-200/40 blur-3xl animate-float2" />
        
        <div className="absolute bottom-[-10rem] left-1/4 h-[26rem] w-[26rem] rounded-full bg-violet-200/30 blur-3xl animate-float3" />
      </div>

      {/* content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* animations */}
      <style>{`
        @keyframes floaty {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }

        .animate-float {
          animation: floaty 8s ease-in-out infinite;
        }

        .animate-float2 {
          animation: floaty 10s ease-in-out infinite;
        }

        .animate-float3 {
          animation: floaty 12s ease-in-out infinite;
        }
      `}</style>

    </div>
  )
}
