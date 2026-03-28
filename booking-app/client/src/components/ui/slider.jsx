// slider.jsx
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Slider = React.forwardRef(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-stone-200">
      <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
    </SliderPrimitive.Track>

    <SliderPrimitive.Thumb
      className={cn(
        "block h-5 w-5 rounded-full border-2 border-amber-500 bg-white shadow-md transition",
        "ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
      )}
    />
  </SliderPrimitive.Root>
));

Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };