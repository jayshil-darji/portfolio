"use client";

import { cn } from "@/lib/utils";

interface BorderBeamProps {
    className?: string;
    size?: number;
    duration?: number;
    borderWidth?: number;
    anchor?: number;
    colorFrom?: string;
    colorTo?: string;
    delay?: number;
}

export const BorderBeam = ({
    className,
    size = 200,
    duration = 15,
    anchor = 90,
    borderWidth = 1.5,
    colorFrom = "#ffaa40",
    colorTo = "#9c40ff",
    delay = 0,
}: BorderBeamProps) => {
    return (
        <>
            {/* LOCAL PATCH: removed <style jsx> keyframes — styled-jsx scopes
                (renames) them, so the Tailwind `animation:border-beam…` class
                never matched. Keyframes now live in styles/vengeance.css as
                `vui-border-beam`. */}
            <div
                aria-hidden="true"
                data-border-beam=""
                style={
                    {
                        "--size": size,
                        "--duration": duration,
                        "--anchor": anchor,
                        "--border-width": borderWidth,
                        "--color-from": colorFrom,
                        "--color-to": colorTo,
                        "--delay": delay,
                    } as React.CSSProperties
                }
                className={cn(
                    "pointer-events-none absolute inset-[0] rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
                    "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
                    "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:[animation:vui-border-beam_calc(var(--duration)*1s)_infinite_linear] after:[animation-delay:calc(var(--delay)*1s)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
                    className,
                )}
            />
        </>
    );
};
