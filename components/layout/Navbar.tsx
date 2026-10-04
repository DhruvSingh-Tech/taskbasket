"use client";

import Link from "next/link";
import GlassSurface from "@/components/GlassSurface";

export default function Navbar() {
  return (
    <header className="fixed top-5 left-6 z-50">
      <GlassSurface
        width="auto"
        height={48}
        borderRadius={20}
        // blur={12}
        backgroundOpacity={0.15}
        saturation={1.2}
        distortionScale={-100}
        redOffset={0}
        className="px-4"
        displace={0.5}
        greenOffset={10}
        blueOffset={20}
        brightness={50}
        opacity={0.93}
        mixBlendMode="screen"

      >
        <nav className="flex items-center gap-6 px-1">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-white hover:text-white/80 transition-colors"
          >
            TaskBasket
          </Link>

          <div className="flex items-center gap-4 text-xs font-medium text-white/70">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/tasks" className="hover:text-white transition-colors">
              Tasks
            </Link>
            <Link href="/about" className="hover:text-white transition-colors">
              About
            </Link>
          </div>
        </nav>
      </GlassSurface>
    </header>
  );
}