import { cn } from "@/lib/utils";

interface DeviceMockupProps {
  type?: "iphone" | "android" | "desktop";
  children: React.ReactNode;
  className?: string;
}

export function DeviceMockup({ type = "iphone", children, className }: DeviceMockupProps) {
  if (type === "desktop") {
    return (
      <div className={cn("relative mx-auto", className)}>
        <div className="bg-gray-800 rounded-t-lg p-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="bg-gray-100 border-2 border-gray-800 rounded-b-lg overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative mx-auto w-64", className)}>
      {/* Device frame */}
      <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
        {/* Screen bezel */}
        <div className="bg-gray-800 rounded-[2rem] overflow-hidden">
          {/* Notch for iPhone */}
          {type === "iphone" && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-900 rounded-b-2xl z-10" />
          )}
          {/* Screen content */}
          <div className="bg-white rounded-[1.5rem] overflow-hidden aspect-[9/16]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
