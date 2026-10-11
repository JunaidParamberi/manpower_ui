type AiIconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

export function AiIcon({ size = 14, className, style, ...rest }: AiIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className={className}
      style={style}
      {...rest}
    >
      <path d="M8 0 C8 0 8.8 3.6 10.4 5.6 C12 7.6 16 8 16 8 C16 8 12 8.4 10.4 10.4 C8.8 12.4 8 16 8 16 C8 16 7.2 12.4 5.6 10.4 C4 8.4 0 8 0 8 C0 8 4 7.6 5.6 5.6 C7.2 3.6 8 0 8 0 Z" />
    </svg>
  );
}
