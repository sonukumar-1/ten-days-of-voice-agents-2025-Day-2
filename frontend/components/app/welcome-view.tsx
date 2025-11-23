import { Button } from '@/components/livekit/button';

function CoffeeCup() {
  return (
    <div className="relative animate-float">
      {/* Steam Animation */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 space-x-2 flex">
        <div className="w-2 h-6 bg-white/40 rounded-full blur-sm animate-steam" style={{ animationDelay: '0s' }}></div>
        <div className="w-2 h-8 bg-white/40 rounded-full blur-sm animate-steam" style={{ animationDelay: '0.5s' }}></div>
        <div className="w-2 h-6 bg-white/40 rounded-full blur-sm animate-steam" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Cup */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-xl"
      >
        {/* Cup Body */}
        <path
          d="M25 30H95L85 100C85 105.523 80.5228 110 75 110H45C39.4772 110 35 105.523 35 100L25 30Z"
          fill="white"
          stroke="#00704A"
          strokeWidth="2"
        />
        {/* Lid */}
        <path
          d="M20 30H100V25C100 22.2386 97.7614 20 95 20H25C22.2386 20 20 22.2386 20 25V30Z"
          fill="white"
          stroke="#00704A"
          strokeWidth="2"
        />
        {/* Sleeve */}
        <path
          d="M28 50H92L89 80H31L28 50Z"
          fill="#C69C6D" // Cardboard color
        />
        {/* Logo Placeholder */}
        <circle cx="60" cy="65" r="12" fill="#00704A" />
        <path
          d="M60 58L62 62H66L63 64L64 68L60 66L56 68L57 64L54 62H58L60 58Z"
          fill="white"
        />
      </svg>
    </div>
  );
}

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  return (
    <div ref={ref} className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent" />

      <section className="relative z-10 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-card/50 backdrop-blur-sm border border-border shadow-2xl max-w-md w-full mx-4 transition-all hover:shadow-primary/20">
        <div className="mb-8">
          <CoffeeCup />
        </div>

        <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">
          Starbucks Barista
        </h1>

        <p className="text-foreground/80 max-w-xs mx-auto mb-8 leading-relaxed">
          Your personal AI coffee companion. Ready to take your order?
        </p>

        <Button
          variant="primary"
          size="lg"
          onClick={onStartCall}
          className="w-full rounded-full font-bold tracking-wide shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-primary text-white hover:bg-primary/90"
        >
          {startButtonText}
        </Button>
      </section>

      <div className="fixed bottom-5 left-0 flex w-full items-center justify-center">
        <p className="text-muted-foreground text-xs font-medium">
          Powered by LiveKit & Murf AI
        </p>
      </div>
    </div>
  );
};
