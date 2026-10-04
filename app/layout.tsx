import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import MicroSlats from "@/components/MicroSlats";

export const metadata: Metadata = {
  title: "TaskBasket - Realtime Collaborative Task Board",
  description: "Realtime multi-window collaborative task board with kraft paper UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={cn("h-full", "dark", "antialiased", "font-sans")}
    >
      <body className="relative h-screen w-screen overflow-hidden bg-black text-white selection:bg-white/20">
        {/* Background Aurora Shader */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden opacity-80">
          <MicroSlats
            preset="swell"
            color="#00ffb3"
            glintColor="#000000"
            backgroundColor="#000000"
            slatWidth={10}
            slatHeight={25}
            gap={3}
            roundness={0.75}
            interactive
            cursorStrength={1}
            cursorSize={40}
            swirl={0}
            trail={1.4}
            lean={0}
            intro
            scale={1.5}
            speed={0.6}
            direction={250}
            chop={0.55}
            stretch={0}
            glint={0.7}
            contrast={1.25}
            perspective={0.55}
            fog={0.55}
            introDuration={1.5}
            paused={true}
          />
        </div>

        <div className="relative z-10 h-screen w-full flex flex-col p-3 sm:p-4 lg:p-5 max-w-[1700px] mx-auto overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
