"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../lib/cn";

type SurfaceCardProps = {
  animated?: boolean;
  soft?: boolean;
  className?: string;
  children: ReactNode;
};

export const SurfaceCard = ({
  animated = false,
  soft = false,
  className,
  children,
}: SurfaceCardProps) => {
  const classes = cn(soft ? "surface-soft" : "surface-card", className);

  if (!animated) {
    return <div className={classes}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={classes}
    >
      {children}
    </motion.div>
  );
};

export const SectionReveal = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);
