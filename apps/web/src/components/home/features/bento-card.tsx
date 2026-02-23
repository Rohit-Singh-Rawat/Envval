import { motion } from "motion/react";
import { EASE_OUT } from "@/lib/animation";
import { cn } from "@/lib/utils";

type BentoCardProps = {
  title: string;
  description: string;
  className?: string;
  children: React.ReactNode;
};

const BentoCard = ({
  title,
  description,
  className,
  children,
}: BentoCardProps) => (
  <motion.div
    className={cn(
      "group/bento relative overflow-hidden rounded-2xl bg-muted flex flex-col",
      className,
    )}
    initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.5, ease: EASE_OUT }}
  >
    <div className="p-5 sm:p-8 pb-3">
      <h3 className="text-lg sm:text-xl font-medium font-zodiak leading-tight text-foreground mb-1">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
    <div className="relative w-full overflow-hidden flex-1 flex flex-col">
      {children}
    </div>
  </motion.div>
);

export default BentoCard;
