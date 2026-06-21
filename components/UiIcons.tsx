import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

function BaseIcon({
  title,
  children,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function RoomIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M9 20v-6h6v6" />
      <path d="M8.5 11.5h7" />
    </BaseIcon>
  );
}

export function SwarmIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.5" y="4" width="17" height="6" rx="1.5" />
      <rect x="4.5" y="15" width="5" height="5" rx="1.2" />
      <rect x="14.5" y="15" width="5" height="5" rx="1.2" />
      <path d="M12 10v3.5M7 13.5h10M7 13.5V15M17 13.5V15" />
      <path d="M8 7h8" />
    </BaseIcon>
  );
}

export function BossIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M8.2 5.4 12 3l3.8 2.4" />
      <path d="M9.2 14.3 12 17l2.8-2.7" />
    </BaseIcon>
  );
}

export function ManagerIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M3 20a5 5 0 0 1 10 0" />
      <path d="M15 7h5M15 12h5M15 17h4" />
      <path d="m13.8 7 .9.9 1.8-2" />
    </BaseIcon>
  );
}

export function AgentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="6" y="7" width="12" height="11" rx="3" />
      <path d="M9 7V5M15 7V5" />
      <circle cx="10" cy="12" r=".7" fill="currentColor" stroke="none" />
      <circle cx="14" cy="12" r=".7" fill="currentColor" stroke="none" />
      <path d="M9.5 15h5" />
      <path d="M4 12h2M18 12h2" />
    </BaseIcon>
  );
}

export function ThoughtIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 16.5a6.5 6.5 0 1 1 4.3 1.5L7 21v-4.5Z" />
      <circle cx="9" cy="11" r=".7" fill="currentColor" stroke="none" />
      <circle cx="12" cy="11" r=".7" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r=".7" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m12 3 9 16H3L12 3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </BaseIcon>
  );
}

export function HumanIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="6" r="3" />
      <path d="M5 21a7 7 0 0 1 14 0" />
      <path d="M4 10l3 3M20 10l-3 3" />
    </BaseIcon>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.4 2.4 2.4 5.2-5.6" />
    </BaseIcon>
  );
}

export function DotIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" />
      <path d="m4 8.5 8 4.5 8-4.5" />
      <path d="M12 13v7" />
    </BaseIcon>
  );
}

export function SpillIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3s5 5.7 5 10a5 5 0 0 1-10 0c0-4.3 5-10 5-10Z" />
      <path d="M8 20c2.5 1 5.5 1 8 0" />
    </BaseIcon>
  );
}

export function PalletIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 8h16M4 13h16M4 18h16" />
      <path d="M6 6v14M12 6v14M18 6v14" />
    </BaseIcon>
  );
}
