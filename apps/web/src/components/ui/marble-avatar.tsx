import { useId, type SVGProps } from 'react';
import {
  hashCode,
  getUnit,
  getColorFromPalette,
  DEFAULT_AVATAR_COLORS,
} from '@/lib/avatar-utils';

const VIEWBOX_SIZE = 80;
const ELEMENT_COUNT = 3;

interface ElementProperties {
  color: string;
  translateX: number;
  translateY: number;
  scale: number;
  rotate: number;
}

export interface MarbleAvatarProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: string;
  colors?: readonly string[];
  square?: boolean;
  size?: number;
}

function generateElementProperties(
  seed: string,
  colors: readonly string[]
): ElementProperties[] {
  const hash = hashCode(seed);

  return Array.from({ length: ELEMENT_COUNT }, (_, i) => {
    const multiplier = hash * (i + 1);
    return {
      color: getColorFromPalette(hash + i, colors),
      translateX: getUnit(multiplier, VIEWBOX_SIZE / 10, 1),
      translateY: getUnit(multiplier, VIEWBOX_SIZE / 10, 2),
      scale: 1.2 + getUnit(multiplier, VIEWBOX_SIZE / 20) / 10,
      rotate: getUnit(multiplier, 360, 1),
    };
  });
}

export function MarbleAvatar({
  name,
  colors = DEFAULT_AVATAR_COLORS,
  square = false,
  size = 32,
  className,
  ...svgProps
}: MarbleAvatarProps) {
  const uniqueId = useId();
  const maskId = `marble-mask-${uniqueId}`;
  const filterId = `marble-filter-${uniqueId}`;

  const [base, primary, secondary] = generateElementProperties(name, colors);
  const center = VIEWBOX_SIZE / 2;
  const borderRadius = square ? 0 : VIEWBOX_SIZE * 2;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
      fill="none"
      role="img"
      aria-label={`Avatar for ${name}`}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      {...svgProps}
    >
      <mask
        id={maskId}
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={VIEWBOX_SIZE}
        height={VIEWBOX_SIZE}
      >
        <rect
          width={VIEWBOX_SIZE}
          height={VIEWBOX_SIZE}
          rx={borderRadius}
          fill="#FFFFFF"
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <rect width={VIEWBOX_SIZE} height={VIEWBOX_SIZE} fill={base.color} />
        <path
          filter={`url(#${filterId})`}
          d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
          fill={primary.color}
          transform={`translate(${primary.translateX} ${primary.translateY}) rotate(${primary.rotate} ${center} ${center}) scale(${secondary.scale})`}
        />
        <path
          filter={`url(#${filterId})`}
          style={{ mixBlendMode: 'overlay' }}
          d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
          fill={secondary.color}
          transform={`translate(${secondary.translateX} ${secondary.translateY}) rotate(${secondary.rotate} ${center} ${center}) scale(${secondary.scale})`}
        />
      </g>
      <defs>
        <filter
          id={filterId}
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity={0} result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation={7} result="effect1_foregroundBlur" />
        </filter>
      </defs>
    </svg>
  );
}
