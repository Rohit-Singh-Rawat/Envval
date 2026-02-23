import { motion } from "motion/react";
import { type ReactNode, useRef } from "react";
import { EASE_OUT } from "@/lib/animation";
import SectionHeading from "../section-heading";
import ExtensionPreview from "./extension-preview";
import { EDITOR_LOGOS } from "./marquee-logos";

const EditorMarquee = ({ className }: { className?: string }) => (
  <div
    className={`w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] ${className ?? ""}`}
  >
    <motion.div
      className="flex gap-4 w-max items-center"
      animate={{ x: ["0%", "-50%"] }}
      transition={{
        x: {
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          duration: 18,
          ease: "linear",
        },
      }}
    >
      {[...EDITOR_LOGOS, ...EDITOR_LOGOS].map((editor, i) => (
        <div
          key={`${editor.name}-${i}`}
          className="flex items-center gap-2 shrink-0 px-4"
        >
          <editor.Logo className="h-6 sm:h-8 w-auto" />
          {editor.showLabel && (
            <span className="text-lg sm:text-xl font-semibold text-foreground whitespace-nowrap">
              {editor.name}
            </span>
          )}
        </div>
      ))}
    </motion.div>
  </div>
);

type IllustrationPanelProps = {
  filterId?: string;
  bgImage?: string;
  children?: ReactNode;
  className?: string;
};

const IllustrationPanel = ({
  filterId = "noise-panel",
  bgImage = "/images/home/feature/sea.png",
  children,
  className,
}: IllustrationPanelProps) => (
  <div
    className={`relative rounded-2xl overflow-hidden w-full flex items-center justify-center shadow-2xs ${className ?? ""}`}
  >
    <svg
      className="absolute inset-0 w-full h-full -z-10"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden={true}
    >
      <defs>
        <filter id={filterId}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>
      <image
        href={bgImage}
        width="100%"
        height="100%"
        style={{ filter: "contrast(0.9) saturate(0.8)" }}
        preserveAspectRatio="xMidYMid slice"
      />
      <rect
        width="100%"
        height="100%"
        filter={`url(#${filterId})`}
        opacity="0.25"
      />
    </svg>
    {children}
  </div>
);

const ExtensionWorkflowSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className="relative overflow-hidden container max-w-7xl mx-auto p-3 sm:p-4 bg-muted rounded-2xl sm:rounded-3xl my-16 sm:my-24 md:my-32">
      <div className="flex flex-col gap-4 sm:gap-5">
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center px-2 sm:px-4 pt-6 sm:pt-8"
        >
          <SectionHeading
            label="Editor Extensions"
            heading="Never leave your editor"
            text="Pull, push, and rotate secrets without switching tabs. End-to-end encrypted sync built right into your workflow."
            align="left"
            className="md:mb-10"
          />
          <EditorMarquee />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE_OUT }}
        >
          <IllustrationPanel
            filterId="noise-workflow"
            className="md:aspect-video"
          >
            <div className="w-full h-full p-2 sm:p-3 md:p-5 flex items-center justify-center">
              <div
                className="w-full h-full items-center justify-center flex"
                ref={containerRef}
              >
                <ExtensionPreview containerRef={containerRef} />
              </div>
            </div>
          </IllustrationPanel>
        </motion.div>
      </div>
    </section>
  );
};

export default ExtensionWorkflowSection;
