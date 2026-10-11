import { siteConfig } from "@/config/site";

export const TITLE_SEPARATOR = " | ";

/** Join title segments without the app suffix (layouts add that). */
export function pageTitle(...segments: string[]) {
  return segments.filter(Boolean).join(TITLE_SEPARATOR);
}

export const appTitleTemplate = `%s${TITLE_SEPARATOR}${siteConfig.name}`;

export function sectionTitleTemplate(section: string) {
  return `%s${TITLE_SEPARATOR}${section}`;
}
