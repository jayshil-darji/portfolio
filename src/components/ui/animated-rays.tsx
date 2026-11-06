"use client";

import { useSyncExternalStore } from "react";
import { useIsClient } from "@/hooks/use-is-client";
import { cn } from "@/lib/utils";

interface AnimatedRaysProps {
    /** Additional CSS classes */
    className?: string;
    /** Optional children to render over the background */
    children?: React.ReactNode;
}

const getIsDark = () => document.documentElement.classList.contains("dark");

function subscribeToDarkClass(onChange: () => void) {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
    });
    return () => observer.disconnect();
}

export function AnimatedRays({
    className = "",
    children,
}: AnimatedRaysProps) {
    // LOCAL PATCH: useSyncExternalStore instead of setState-in-useEffect
    // (react-hooks/set-state-in-effect). Server snapshot = not mounted, so the
    // SSR markup and hydration render match; the client then re-renders.
    const mounted = useIsClient();
    const isDark = useSyncExternalStore(subscribeToDarkClass, getIsDark, () => false);

    if (!mounted) return null;

    const stripes = `repeating-linear-gradient(
        100deg,
        var(--stripe-color) 0%,
        var(--stripe-color) 7%,
        transparent 10%,
        transparent 12%,
        var(--stripe-color) 16%
    )`;
    // LOCAL PATCH: palette limited to teal/blue/violet (upstream used fuchsia).
    const rainbow = `repeating-linear-gradient(
        100deg,
        #60a5fa 10%,
        #8b5cf6 15%,
        #60a5fa 20%,
        #5eead4 25%,
        #60a5fa 30%
    )`;

    return (
        // LOCAL PATCH: <div> instead of <section> (purely decorative, avoids a
        // nested landmark), aria-hidden, and `vui-rays` scopes --stripe-color.
        <div
            aria-hidden="true"
            className={cn("vui-rays relative w-full h-full overflow-hidden", className)}
        >
            {/* Aurora Background — matches original .hero */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: `${stripes}, ${rainbow}`,
                    backgroundSize: "300%, 200%",
                    backgroundPosition: "50% 50%, 50% 50%",
                    filter: isDark
                        ? "blur(10px) opacity(50%) saturate(140%)" /* LOCAL PATCH: was 200% */
                        : "blur(10px) invert(100%)",
                    maskImage: "radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%)",
                    WebkitMaskImage: "radial-gradient(ellipse at 100% 0%, black 40%, transparent 70%)",
                }}
            >
                {/* Animated overlay — matches original .hero::after */}
                <div
                    className="absolute inset-0 animate-aurora-bg"
                    style={{
                        backgroundImage: `${stripes}, ${rainbow}`,
                        backgroundSize: "200%, 100%",
                        backgroundAttachment: "fixed",
                        mixBlendMode: "difference",
                    }}
                />
            </div>

            {children && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
                    {children}
                </div>
            )}
        </div>
    );
}

export default AnimatedRays;
