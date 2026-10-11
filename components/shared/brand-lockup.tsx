import Image from "next/image";
import Link from "next/link";

import { branding } from "@/config/branding";
import { cn } from "@/lib/utils";

type BrandLockupProps = {
  className?: string;
  /** Extra classes on the wordmark wrapper (e.g. sidebar `group-data-[collapsible=icon]:hidden`). */
  wordmarkWrapperClassName?: string;
  /** Force dark-bg wordmark regardless of color scheme (use when container is always dark, e.g. navy sidebar). */
  forceDarkWordmark?: boolean;
};

/**
 * Default-colored mark + theme-aware wordmark (dark type on light bg, light type on dark bg).
 */
export function BrandLockup({
  className,
  wordmarkWrapperClassName,
  forceDarkWordmark = false,
}: BrandLockupProps) {
  return (
    <div className={cn("shrink-0", className)}>
      <div className="flex items-end gap-2 leading-none">
        <Image
          src={branding.mark}
          alt=""
          width={32}
          height={32}
          unoptimized
          className="block size-6 shrink-0 object-contain object-bottom sm:size-7 group-data-[collapsible=icon]:size-8"
        />
        <span
          className={cn(
            "flex min-w-0 items-end leading-none",
            wordmarkWrapperClassName,
          )}
        >
          {!forceDarkWordmark && (
            <Image
              src={branding.wordmarkOnLightBg}
              alt=""
              width={160}
              height={36}
              unoptimized
              className="block h-[1.125rem] w-auto max-w-[min(100%,11rem)] object-contain object-left-bottom dark:hidden sm:h-5"
            />
          )}
          <Image
            src={branding.wordmarkOnDarkBg}
            alt=""
            width={160}
            height={36}
            unoptimized
            className={cn(
              "h-[1.125rem] w-auto max-w-[min(100%,11rem)] object-contain object-left-bottom sm:h-5",
              forceDarkWordmark ? "block" : "hidden dark:block",
            )}
          />
        </span>
      </div>
    </div>
  );
}

type BrandLockupLinkProps = BrandLockupProps & {
  href?: string;
  linkClassName?: string;
};

export function BrandLockupLink({
  href = "/dashboard",
  className,
  linkClassName,
  wordmarkWrapperClassName,
  forceDarkWordmark,
}: BrandLockupLinkProps) {
  return (
    <Link
      href={href}
      aria-label="Manpower home"
      className={cn(
        "inline-flex shrink-0 items-center transition-opacity hover:opacity-90",
        linkClassName,
      )}
    >
      <BrandLockup
        className={className}
        wordmarkWrapperClassName={wordmarkWrapperClassName}
        forceDarkWordmark={forceDarkWordmark}
      />
    </Link>
  );
}
