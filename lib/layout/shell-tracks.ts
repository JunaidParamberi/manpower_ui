/**
 * Desktop shell grid: [sidebar] [gap] [page] [docked Kraft].
 *
 * The shell sits on a frame with SHELL_FRAME_PAD of padding; sidebar, page and
 * docked Kraft are separate panels SHELL_GAP apart. The gap track also hosts
 * the sidebar resize handle. Mobile ignores this (the grid is display:block).
 */
export const SHELL_FRAME_PAD = 8;
export const SHELL_GAP = 8;
export const SIDEBAR_RAIL_WIDTH = 56;

export type ShellTracksInput = {
  sidebarOpen: boolean;
  sidebarWidth: number;
  /** 0 when Kraft is closed, floating, or on mobile. */
  kraftDockedWidth: number;
};

export type ShellTracks = {
  columns: string;
  /** Viewport x of the page panel's left edge — Kraft centres its island on it. */
  pageLeft: number;
};

export function shellTracks({ sidebarOpen, sidebarWidth, kraftDockedWidth }: ShellTracksInput): ShellTracks {
  const side = sidebarOpen ? sidebarWidth : SIDEBAR_RAIL_WIDTH;
  const kraft = kraftDockedWidth > 0 ? kraftDockedWidth + SHELL_GAP : 0;
  return {
    columns: `${side}px ${SHELL_GAP}px minmax(0, 1fr) ${kraft}px`,
    pageLeft: SHELL_FRAME_PAD + side + SHELL_GAP,
  };
}
