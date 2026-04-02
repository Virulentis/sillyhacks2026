import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
} from "motion/react";
import { useEffect } from "react";

export default function CustomCursor() {
  const mouse = {
    x: useMotionValue(0),
    y: useMotionValue(0),
  };

  const springOptions = { stiffness: 40, damping: 10 };
  const smoothMouse = {
    x: useSpring(mouse.x, springOptions),
    y: useSpring(mouse.y, springOptions),
  };

  const handleCursor = (e) => {
    mouse.x.set(e.clientX);
    mouse.y.set(e.clientY);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleCursor);
    document.body.style.cursor = "none";
    return () => {
      window.removeEventListener("mousemove", handleCursor);
      document.body.style.cursor = "";
    };
  }, []);

  const background = useMotionTemplate`radial-gradient(circle var(--cursor-size, 400px) at ${smoothMouse.x}px ${smoothMouse.y}px, transparent 0%, rgba(0,0,0,0.95) 80%)`;

  return (
    <motion.div
      style={{
        position: "fixed",
        inset: 0,
        background,
        zIndex: 9999,
        pointerEvents: "none",
        
      }}
    />
  );
}
