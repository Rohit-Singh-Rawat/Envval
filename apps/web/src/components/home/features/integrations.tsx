import { Link01Icon } from "hugeicons-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EASE_IN_OUT, EASE_OUT, EASE_OUT_SMOOTH } from "@/lib/animation";

const CX = 160;
const CY = 100;
const BOX = 34;
const BOX_R = 8;
const ICON_SCALE = 14 / 24;

/* SVG icons — primary and alternate for hover swap */

const IconGitHub = (
  <path
    fill="currentColor"
    d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
  />
);

const IconVercel = (
  <svg
    x="0"
    y="0"
    width="24"
    height="24"
    viewBox="0 0 256 222"
    aria-hidden={true}
  >
    <path fill="currentColor" d="m128 0l128 221.705H0z" />
  </svg>
);

const IconTerminal = (
  <g fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 12c0-4.714 0-7.071 1.464-8.536C4.93 2 7.286 2 12 2s7.071 0 8.535 1.464C22 4.93 22 7.286 22 12s0 7.071-1.465 8.535C19.072 22 16.714 22 12 22s-7.071 0-8.536-1.465C2 19.072 2 16.714 2 12Z" />
    <path
      strokeLinecap="round"
      d="M17 15h-5m-5-5l.234.195c1.282 1.068 1.923 1.602 1.923 2.305s-.64 1.237-1.923 2.305L7 15"
    />
  </g>
);

const IconCloudflare = (
  <svg
    x="0"
    y="0"
    width="24"
    height="24"
    viewBox="0 0 128 128"
    aria-hidden={true}
  >
    <path
      fill="#fff"
      d="m115.679 69.288l-15.591-8.94l-2.689-1.163l-63.781.436v32.381h82.061z"
    />
    <path
      fill="#f38020"
      d="M87.295 89.022c.763-2.617.472-5.015-.8-6.796c-1.163-1.635-3.125-2.58-5.488-2.689l-44.737-.581c-.291 0-.545-.145-.691-.363s-.182-.509-.109-.8c.145-.436.581-.763 1.054-.8l45.137-.581c5.342-.254 11.157-4.579 13.192-9.885l2.58-6.723c.109-.291.145-.581.073-.872c-2.906-13.158-14.644-22.97-28.672-22.97c-12.938 0-23.913 8.359-27.838 19.952a13.35 13.35 0 0 0-9.267-2.58c-6.215.618-11.193 5.597-11.811 11.811c-.145 1.599-.036 3.162.327 4.615C10.104 70.051 2 78.337 2 88.549c0 .909.073 1.817.182 2.726a.895.895 0 0 0 .872.763h82.57c.472 0 .909-.327 1.054-.8z"
    />
    <path
      fill="#faae40"
      d="M101.542 60.275c-.4 0-.836 0-1.236.036c-.291 0-.545.218-.654.509l-1.744 6.069c-.763 2.617-.472 5.015.8 6.796c1.163 1.635 3.125 2.58 5.488 2.689l9.522.581c.291 0 .545.145.691.363s.182.545.109.8c-.145.436-.581.763-1.054.8l-9.924.582c-5.379.254-11.157 4.579-13.192 9.885l-.727 1.853c-.145.363.109.727.509.727h34.089c.4 0 .763-.254.872-.654c.581-2.108.909-4.325.909-6.614c0-13.447-10.975-24.422-24.458-24.422"
    />
  </svg>
);

const IconSlack = (
  <svg
    x="0"
    y="0"
    width="24"
    height="24"
    viewBox="0 0 256 256"
    aria-hidden={true}
  >
    <path
      fill="#E01E5A"
      d="M53.841 161.32c0 14.832-11.987 26.82-26.819 26.82S.203 176.152.203 161.32c0-14.831 11.987-26.818 26.82-26.818H53.84zm13.41 0c0-14.831 11.987-26.818 26.819-26.818s26.819 11.987 26.819 26.819v67.047c0 14.832-11.987 26.82-26.82 26.82c-14.83 0-26.818-11.988-26.818-26.82z"
    />
    <path
      fill="#36C5F0"
      d="M94.07 53.638c-14.832 0-26.82-11.987-26.82-26.819S79.239 0 94.07 0s26.819 11.987 26.819 26.819v26.82zm0 13.613c14.832 0 26.819 11.987 26.819 26.819s-11.987 26.819-26.82 26.819H26.82C11.987 120.889 0 108.902 0 94.069c0-14.83 11.987-26.818 26.819-26.818z"
    />
    <path
      fill="#2EB67D"
      d="M201.55 94.07c0-14.832 11.987-26.82 26.818-26.82s26.82 11.988 26.82 26.82s-11.988 26.819-26.82 26.819H201.55zm-13.41 0c0 14.832-11.988 26.819-26.82 26.819c-14.831 0-26.818-11.987-26.818-26.82V26.82C134.502 11.987 146.489 0 161.32 0s26.819 11.987 26.819 26.819z"
    />
    <path
      fill="#ECB22E"
      d="M161.32 201.55c14.832 0 26.82 11.987 26.82 26.818s-11.988 26.82-26.82 26.82c-14.831 0-26.818-11.988-26.818-26.82V201.55zm0-13.41c-14.831 0-26.818-11.988-26.818-26.82c0-14.831 11.987-26.818 26.819-26.818h67.25c14.832 0 26.82 11.987 26.82 26.819s-11.988 26.819-26.82 26.819z"
    />
  </svg>
);

const IconDatabase = (
  <g fill="none">
    <path
      fill="#b2b2b2"
      d="M2.047 5.19v13.62C2.047 21.124 6.504 23 12 23s9.953-1.875 9.953-4.19V5.19z"
    />
    <path
      fill="#e3e3e3"
      d="M12 5.19H2.047v13.62C2.047 21.124 6.504 23 12 23z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.047 5.19v13.62C2.047 21.124 6.504 23 12 23s9.953-1.875 9.953-4.19V5.19"
    />
    <path
      fill="gray"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9.381c5.498 0 9.954-1.875 9.954-4.19S17.498 1 12 1S2.048 2.875 2.048 5.19S6.504 9.382 12 9.382"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.953 9.38c0 2.316-4.457 4.191-9.953 4.191s-9.953-1.875-9.953-4.19m19.906 4.714c0 2.315-4.457 4.19-9.953 4.19s-9.953-1.875-9.953-4.19"
    />
  </g>
);

const IconGitLab = (
  <svg
    x="0"
    y="0"
    width="24"
    height="24"
    viewBox="0 0 32 32"
    aria-hidden={true}
  >
    <path
      fill="#e24329"
      d="M29.5 13.2v-.1l-3.8-9.9c-.1-.2-.2-.4-.4-.5c-.4-.2-.8-.2-1.2.1c-.1.1-.3.2-.3.4l-2.6 7.9H10.8L8.2 3.2c0-.2-.2-.3-.3-.5c-.4-.2-.8-.3-1.2 0c-.2.1-.3.2-.4.4L2.5 13v.1c-1.1 2.9-.2 6.3 2.3 8.2l5.8 4.3l2.9 2.2l1.7 1.3c.4.3 1 .3 1.4 0l1.7-1.3l2.9-2.2l5.8-4.4c2.7-1.7 3.7-5.1 2.5-8"
    />
    <path
      fill="#fc6d26"
      d="M29.5 13.2v-.1c-1.9.4-3.6 1.2-5.1 2.3L16 21.7c2.9 2.2 5.3 4 5.3 4l5.8-4.4c2.6-1.8 3.6-5.2 2.4-8.1"
    />
    <path
      fill="#fca326"
      d="m10.7 25.8l2.9 2.2l1.7 1.3c.4.3 1 .3 1.4 0l1.7-1.3l2.9-2.2s-2.5-1.9-5.3-4c-2.9 2.1-5.3 4-5.3 4"
    />
    <path
      fill="#fc6d26"
      d="M7.6 15.4c-1.5-1.1-3.3-1.9-5.1-2.3v.1c-1.1 2.9-.2 6.3 2.3 8.2l5.8 4.3s2.5-1.9 5.3-4z"
    />
  </svg>
);

const IconDocker = (
  <svg
    x="0"
    y="0"
    width="24"
    height="24"
    viewBox="0 0 256 185"
    aria-hidden={true}
  >
    <path
      fill="#2396ED"
      d="M250.716 70.497c-5.765-4-18.976-5.5-29.304-3.5c-1.2-10-6.725-18.749-16.333-26.499l-5.524-4l-3.844 5.75c-4.803 7.5-7.205 18-6.485 28c.24 3.499 1.441 9.749 5.044 15.249c-3.362 2-10.328 4.5-19.455 4.5H1.155l-.48 2c-1.682 9.999-1.682 41.248 18.014 65.247c14.892 18.249 36.99 27.499 66.053 27.499c62.93 0 109.528-30.25 131.386-84.997c8.647.25 27.142 0 36.51-18.75c.24-.5.72-1.5 2.401-5.249l.961-2zM139.986 0h-26.42v24.999h26.42zm0 29.999h-26.42v24.999h26.42zm-31.225 0h-26.42v24.999h26.42zm-31.225 0H51.115v24.999h26.421zM46.311 59.998H19.89v24.999h26.42zm31.225 0H51.115v24.999h26.421zm31.225 0h-26.42v24.999h26.42zm31.226 0h-26.422v24.999h26.422zm31.225 0H144.79v24.999h26.422z"
    />
  </svg>
);

const IconKubernetes = (
  <svg
    x="0"
    y="0"
    width="24"
    height="24"
    viewBox="0 0 128 128"
    aria-hidden={true}
  >
    <path
      fill="#326ce5"
      d="M63.556 1.912a8.51 8.44 0 0 0-3.26.826L15.795 24a8.51 8.44 0 0 0-4.604 5.725L.214 77.485a8.51 8.44 0 0 0 1.155 6.47a8.51 8.44 0 0 0 .484.672l30.8 38.296a8.51 8.44 0 0 0 6.653 3.176l49.394-.012a8.51 8.44 0 0 0 6.653-3.17l30.789-38.301a8.51 8.44 0 0 0 1.645-7.142l-10.996-47.76a8.51 8.44 0 0 0-4.604-5.726L67.682 2.738a8.51 8.44 0 0 0-4.126-.826"
    />
    <path
      fill="#fff"
      d="M63.975 18.143v.01c-1.472.014-2.664 1.336-2.664 2.972c0 .028.005.052.005.074c-.002.222-.012.49-.005.684c.035.946.24 1.668.365 2.535c.17 1.42.215 2.547.224 3.687l.036-.164a41 41 0 0 0-.118-2.394c.139 1.228.24 2.364.186 3.392c-.015-.325-.061-.677-.066-.982l-.036.164c.003.347.096.79.069 1.123c-.061.29-.291.495-.467.742l-.025.121c.173-.227.354-.444.46-.699c-.134.423-.42.796-.707 1.094c.08-.124.146-.262.24-.385l.026-.12c-.145.203-.227.457-.385.61l-.006.006l-.064 1.12a35 35 0 0 0-4.797.736a34.3 34.3 0 0 0-17.398 9.935c-.296-.202-.8-.56-.95-.672l-.005-.005l-.01.002c-.478.064-.95.207-1.57-.153c-1.187-.8-2.271-1.907-3.584-3.24c-.601-.637-1.037-1.246-1.754-1.861c-.163-.141-.41-.33-.592-.473a3.2 3.2 0 0 0-1.87-.705c-.825-.028-1.62.294-2.14.947c-.925 1.16-.628 2.933.658 3.96l.04.026c.174.143.39.326.552.446c.762.561 1.457.849 2.21 1.293c1.594.984 2.91 1.798 3.956 2.779c.402.427.474 1.19.53 1.525v.008l.847.754c-4.561 6.874-6.675 15.36-5.432 24.006l-1.103.324l-.004.006c-.295.381-.712.972-1.135 1.147c-1.366.43-2.908.588-4.77.783c-.872.073-1.626.031-2.556.207c-.205.04-.49.112-.713.164l-.023.006l-.04.011c-1.58.383-2.6 1.837-2.27 3.272c.327 1.435 1.873 2.306 3.464 1.963l.039-.006h.002c.02-.005.038-.015.05-.018c.22-.048.496-.101.69-.154c.913-.245 1.574-.603 2.393-.916c1.76-.632 3.218-1.16 4.637-1.365c.582-.046 1.204.362 1.517.537l.008.004l1.152-.197c2.674 8.274 8.266 14.96 15.346 19.162l-.48 1.152l.003.01c.174.45.364 1.057.237 1.492c-.516 1.336-1.4 2.749-2.408 4.326c-.488.728-.99 1.295-1.43 2.131c-.107.201-.24.507-.342.717c-.69 1.475-.184 3.177 1.143 3.816c1.335.643 2.99-.036 3.707-1.513l.007-.008v-.01c.1-.207.242-.478.329-.674c.378-.866.505-1.607.77-2.441h-.003c.706-1.773 1.094-3.627 2.059-4.778c.26-.31.688-.432 1.136-.552l.01-.004l.6-1.084a34.44 34.44 0 0 0 24.556.062c.172.303.478.865.563 1.01l.004.006l.008.004c.458.149.948.223 1.35.816c.722 1.237 1.218 2.703 1.822 4.475c.265.832.397 1.575.775 2.441c.087.2.23.475.33.684c.715 1.482 2.375 2.163 3.713 1.52c1.326-.64 1.832-2.34 1.143-3.815c-.102-.21-.243-.518-.348-.719c-.441-.836-.943-1.397-1.43-2.125c-1.01-1.577-1.843-2.885-2.36-4.222c-.213-.685.036-1.104.206-1.555l.006-.014l-.01-.01a1 1 0 0 1-.09-.168a6 6 0 0 1-.12-.29c-.08-.21-.16-.442-.224-.596c7.358-4.35 12.786-11.285 15.34-19.295c.347.054.93.155 1.12.193l.01.002l.009-.004c.402-.265.76-.606 1.475-.549c1.419.205 2.876.734 4.638 1.366c.817.312 1.479.677 2.393.921c.194.052.47.101.69.149c.012.003.029.012.05.017h.002l.04.004c1.59.341 3.137-.528 3.464-1.963s-.691-2.888-2.272-3.269c-.227-.052-.551-.141-.775-.184c-.93-.176-1.683-.132-2.557-.205c-1.86-.195-3.402-.353-4.77-.783c-.547-.213-.942-.872-1.138-1.148l-.006-.006l-1.066-.31a34.4 34.4 0 0 0-.56-12.425a34.5 34.5 0 0 0-4.983-11.525c.278-.252.785-.701.932-.836l.007-.006v-.01c.044-.48.006-.97.495-1.494c1.045-.98 2.364-1.797 3.957-2.779c.754-.444 1.454-.731 2.214-1.293c.174-.128.408-.328.588-.473c1.286-1.026 1.584-2.798.658-3.959c-.925-1.16-2.718-1.267-4.003-.242c-.182.145-.43.332-.594.473c-.717.618-1.16 1.226-1.76 1.863c-1.313 1.335-2.398 2.446-3.586 3.246c-.507.294-1.258.193-1.603.172h-.008l-1.004.719c-5.775-6.048-13.63-9.916-22.09-10.672a64 64 0 0 1-.064-1.174v-.008l-.006-.006c-.35-.333-.76-.61-.864-1.318v-.002c-.115-1.428.077-2.967.3-4.824c.125-.867.332-1.59.366-2.535c.009-.216-.005-.527-.005-.758c0-1.645-1.203-2.982-2.688-2.982z"
    />
  </svg>
);

type NodeConfig = {
  x: number;
  y: number;
  icon: React.ReactNode;
  altIcon?: React.ReactNode;
  swapOnHover?: boolean;
};

const NODES: NodeConfig[] = [
  { x: 52, y: 35, icon: IconGitHub, altIcon: IconGitLab, swapOnHover: true },
  { x: 268, y: 35, icon: IconVercel },
  { x: 22, y: 100, icon: IconTerminal, altIcon: IconDocker, swapOnHover: true },
  {
    x: 298,
    y: 100,
    icon: IconCloudflare,
    altIcon: IconKubernetes,
    swapOnHover: true,
  },
  { x: 52, y: 165, icon: IconSlack },
  { x: 268, y: 165, icon: IconDatabase },
];

function getPath(nx: number, ny: number) {
  if (Math.abs(ny - CY) < 15) return `M${nx},${ny} L${CX},${CY}`;
  const bendX = nx + (CX - nx) * 0.4;
  return `M${nx},${ny} L${bendX},${ny} L${CX},${CY}`;
}

function getPathLength(nx: number, ny: number): number {
  const dx = nx - CX;
  const dy = ny - CY;
  return Math.sqrt(dx * dx + dy * dy) * (Math.abs(dy) < 15 ? 1 : 1.2);
}

const DIRECTIONS = [true, false, true, false, false, true];

const IntegrationsIllustration = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-60px" });
  const [phase, setPhase] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!isInView) return;

    phaseTimers.current.push(setTimeout(() => setPhase(1), 500));
    phaseTimers.current.push(setTimeout(() => setPhase(2), 1100));
    phaseTimers.current.push(setTimeout(() => setPhase(3), 1800));

    return () => phaseTimers.current.forEach(clearTimeout);
  }, [isInView]);

  const handleHover = useCallback(() => setIsHovered(true), []);
  const handleLeave = useCallback(() => setIsHovered(false), []);

  const shadowId = useId();

  return (
    <div
      ref={containerRef}
      className="relative mx-3 mb-3 cursor-pointer"
      style={{ height: 200 }}
      role="img"
      aria-label="Integrations hub connecting to GitHub, CLI, Vercel, Cloud, Slack, and Database"
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 320 200"
        fill="none"
        aria-hidden={true}
      >
        <defs>
          <filter id={shadowId} x="-8%" y="-8%" width="116%" height="124%">
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1.5"
              floodColor="black"
              floodOpacity="0.06"
            />
          </filter>

          {NODES.map((n) => (
            <path
              key={`p-${n.x}-${n.y}`}
              id={`int-p-${n.x}-${n.y}`}
              d={getPath(n.x, n.y)}
            />
          ))}

          {NODES.map((n, i) => {
            const reverse = !DIRECTIONS[i];
            const dur = 3.4 + i * 0.2;
            return (
              <linearGradient
                key={`sg-${n.x}-${n.y}`}
                id={`int-sig-${i}`}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="transparent" />
                <stop
                  offset="15%"
                  stopColor="var(--color-primary)"
                  stopOpacity="0.06"
                />
                <stop
                  offset="35%"
                  stopColor="var(--color-primary)"
                  stopOpacity="0.35"
                />
                <stop
                  offset="50%"
                  stopColor="var(--color-primary)"
                  stopOpacity="0.8"
                />
                <stop
                  offset="65%"
                  stopColor="var(--color-primary)"
                  stopOpacity="0.35"
                />
                <stop
                  offset="85%"
                  stopColor="var(--color-primary)"
                  stopOpacity="0.06"
                />
                <stop offset="100%" stopColor="transparent" />
                <animate
                  attributeName="x1"
                  values={reverse ? "200;-50" : "-50;200"}
                  dur={`${dur}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                />
                <animate
                  attributeName="x2"
                  values={reverse ? "250;0" : "0;250"}
                  dur={`${dur}s`}
                  repeatCount="indefinite"
                  begin={`${i * 0.4}s`}
                />
              </linearGradient>
            );
          })}
        </defs>

        {/* Connection lines */}
        {NODES.map((n, i) => {
          const pathD = getPath(n.x, n.y);
          const len = getPathLength(n.x, n.y);
          return (
            <motion.path
              key={`l-${n.x}-${n.y}`}
              d={pathD}
              stroke="currentColor"
              className="text-muted-foreground/30"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                phase >= 2
                  ? { pathLength: 1, opacity: 1 }
                  : { pathLength: 0, opacity: 0 }
              }
              transition={{
                pathLength: {
                  duration: 0.6,
                  delay: i * 0.08,
                  ease: EASE_IN_OUT,
                },
                opacity: { duration: 0.15, delay: i * 0.08 },
              }}
              style={{
                strokeDashoffset: 0,
                ...(phase < 3 ? { strokeDasharray: `${len} ${len}` } : {}),
              }}
            />
          );
        })}

        {/* Dashed overlay after draw */}
        {phase >= 3 &&
          NODES.map((n, i) => (
            <motion.path
              key={`ld-${n.x}-${n.y}`}
              d={getPath(n.x, n.y)}
              stroke="var(--color-border)"
              strokeWidth="1"
              strokeDasharray="4 4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            />
          ))}

        {/* Signal sweeps */}
        {phase >= 3 &&
          NODES.map((n, i) => (
            <path
              key={`sig-${n.x}-${n.y}`}
              d={getPath(n.x, n.y)}
              stroke={`url(#int-sig-${i})`}
              strokeWidth="2"
              fill="none"
            />
          ))}

        {/* Center hub */}
        <motion.g
          initial={{ opacity: 0, scale: 0.95 }}
          animate={
            isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }
          }
          transition={{ duration: 0.5, ease: EASE_OUT }}
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        >
          <circle cx={CX} cy={CY} r="22" fill="var(--color-muted)" />
          <circle cx={CX} cy={CY} r="18" fill="var(--color-primary)" />
          <motion.circle
            cx={CX}
            cy={CY}
            r="26"
            fill="var(--color-primary)"
            animate={
              isHovered
                ? { opacity: [0.08, 0.15, 0.08], r: [26, 30, 26] }
                : { opacity: 0.08, r: 26 }
            }
            transition={
              isHovered
                ? { duration: 1.8, repeat: Infinity, ease: EASE_IN_OUT }
                : { duration: 0.3 }
            }
          />
          <g transform={`translate(${CX - 8.89},${CY - 8})`}>
            <Link01Icon size={16} className="text-white" />
          </g>
        </motion.g>

        {/* Integration nodes */}
        {NODES.map((n, i) => (
          <motion.g
            key={`n-${n.x}-${n.y}`}
            initial={{ opacity: 0, filter: "blur(8px)", scale: 0.95 }}
            animate={
              phase >= 1
                ? { opacity: 1, filter: "blur(0px)", scale: 1 }
                : { opacity: 0, filter: "blur(8px)", scale: 0.95 }
            }
            transition={{ duration: 0.45, delay: i * 0.1, ease: EASE_OUT }}
            style={{ transformOrigin: `${n.x}px ${n.y}px` }}
          >
            <rect
              x={n.x - BOX / 2}
              y={n.y - BOX / 2}
              width={BOX}
              height={BOX}
              rx={BOX_R}
              fill="var(--color-card)"
              stroke="var(--color-border)"
              strokeWidth="1"
              filter={`url(#${shadowId})`}
            />
            <g
              transform={`translate(${n.x},${n.y}) scale(${ICON_SCALE}) translate(-12,-12)`}
            >
              {n.swapOnHover && n.altIcon ? (
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.g
                    key={isHovered ? `alt-${n.x}-${n.y}` : `pri-${n.x}-${n.y}`}
                    initial={{ opacity: 0, filter: "blur(5px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, filter: "blur(2px)" }}
                    transition={{ duration: 0.4, ease: EASE_OUT_SMOOTH }}
                  >
                    {isHovered ? n.altIcon : n.icon}
                  </motion.g>
                </AnimatePresence>
              ) : (
                n.icon
              )}
            </g>
          </motion.g>
        ))}
      </svg>
    </div>
  );
};

export default IntegrationsIllustration;
