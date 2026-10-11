const PALETTES: [string, string][] = [
  ["#3550E0", "#6E83F0"],
  ["#1F8A52", "#3FB87D"],
  ["#B36A12", "#E0995E"],
  ["#C13838", "#E76B6B"],
  ["#2F6FB8", "#6FA8E6"],
  ["#6B4FA8", "#9B7FD8"],
];

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffff;
  return Math.abs(h) % PALETTES.length;
}

type GradientAvatarProps = {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
};

export function GradientAvatar({ name, size = 32, className, style }: GradientAvatarProps) {
  const initials = name.slice(0, 2).toUpperCase();
  const [from, to] = PALETTES[hashStr(name)];

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${from}, ${to})`,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontSize: size * 0.375,
        fontWeight: 600,
        flexShrink: 0,
        userSelect: "none",
        ...style,
      }}
    >
      {initials}
    </div>
  );
}
