import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import { EASE } from "./Reveal";

/**
 * Manga "impact frame" intro: speed lines converge, a brushstroke draws,
 * the logo snaps in, then the whole frame lifts away.
 */
export function IntroLoader({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), reduce ? 600 : 2100);
    return () => clearTimeout(t);
  }, [reduce]);

  const dismiss = () => setVisible(false);

  useEffect(() => {
    window.addEventListener("wheel", dismiss, { passive: true, once: true });
    window.addEventListener("touchmove", dismiss, { passive: true, once: true });
    return () => {
      window.removeEventListener("wheel", dismiss);
      window.removeEventListener("touchmove", dismiss);
    };
  }, []);

  const lines = Array.from({ length: 18 });

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          key="intro"
          role="presentation"
          onClick={dismiss}
          className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-background"
          exit={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {/* speed lines */}
          {!reduce &&
            lines.map((_, i) => {
              const angle = (360 / lines.length) * i;
              return (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-[46vmax] w-px origin-top bg-foreground/15"
                  style={{ rotate: `${angle}deg` }}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: [0, 1, 0.25] }}
                  transition={{ duration: 0.9, delay: 0.06 + i * 0.012, ease: EASE }}
                />
              );
            })}

          <div className="absolute inset-0 grid place-items-center px-6">
            <div className="relative w-full max-w-md text-center">
              <div className="hero-glow absolute inset-x-8 -top-6 h-40 opacity-70" />

              {/* brushstroke draw */}
              <svg
                viewBox="0 0 400 60"
                className="relative mx-auto mb-6 w-full max-w-[320px]"
                aria-hidden="true"
              >
                <motion.path
                  d="M8 44 C 90 8, 170 52, 250 20 S 350 34, 392 14"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: reduce ? 0.3 : 1.1, ease: EASE }}
                />
              </svg>

              <motion.div
                initial={{ opacity: 0, scale: reduce ? 1 : 1.3, filter: "blur(6px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, delay: reduce ? 0.1 : 0.75, ease: EASE }}
              >
                <Logo className="mx-auto h-24 w-auto sm:h-28" />
                <p className="eyebrow mt-4 text-muted-foreground">Anime Merch</p>
              </motion.div>

              <motion.p
                className="mt-10 text-[11px] tracking-[0.2em] text-muted-foreground uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
              >
                Tap or scroll to enter
              </motion.p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
