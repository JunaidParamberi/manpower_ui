import type { IconType } from "react-icons";
import {
  FaFacebook,
  FaGlobe,
  FaInstagram,
  FaLinkedin,
  FaThreads,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

/**
 * Platforms offered as suggestions in the post dialog and as filter options.
 * Filter options are the union of this list, the platforms on the loaded
 * posts, and the currently active filter value — so a platform filter can
 * never vanish just because the visible period happens to be empty.
 */
export const COMMON_PLATFORMS = [
  "Instagram",
  "LinkedIn",
  "X",
  "Facebook",
  "TikTok",
  "YouTube",
  "Threads",
] as const;

/**
 * Brand marks come from react-icons, not lucide: lucide-react 1.27.0 (the
 * version installed here) no longer ships brand icons at all. react-icons is
 * already a dependency and is already used for exactly this reason — see
 * `FcGoogle` in `components/login-form.tsx`. The Font Awesome 6 set is used
 * rather than Simple Icons because Simple Icons has dropped LinkedIn.
 *
 * The globe fallback is drawn from the same set so every value in the map has
 * one type (`IconType`) and no lucide/react-icons type mixing is needed.
 */
const PLATFORM_ICONS: Record<string, IconType> = {
  instagram: FaInstagram,
  linkedin: FaLinkedin,
  x: FaXTwitter,
  twitter: FaXTwitter,
  facebook: FaFacebook,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  threads: FaThreads,
};

/** Icon for a free-text platform name, falling back to a globe. */
export function platformIcon(platform: string): IconType {
  return PLATFORM_ICONS[platform.trim().toLowerCase()] ?? FaGlobe;
}
