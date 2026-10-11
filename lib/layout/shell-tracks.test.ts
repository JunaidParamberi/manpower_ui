import { describe, expect, it } from "vitest";

import { SHELL_FRAME_PAD, SHELL_GAP, SIDEBAR_RAIL_WIDTH, shellTracks } from "./shell-tracks";

describe("shellTracks", () => {
  it("lays out an open sidebar, gap, page and no Kraft track", () => {
    const t = shellTracks({ sidebarOpen: true, sidebarWidth: 240, kraftDockedWidth: 0 });
    expect(t.columns).toBe("240px 8px minmax(0, 1fr) 0px");
  });

  it("uses the rail width when collapsed and keeps the gap", () => {
    const t = shellTracks({ sidebarOpen: false, sidebarWidth: 240, kraftDockedWidth: 0 });
    expect(t.columns).toBe(`${SIDEBAR_RAIL_WIDTH}px 8px minmax(0, 1fr) 0px`);
  });

  it("adds the panel gap in front of a docked Kraft", () => {
    const t = shellTracks({ sidebarOpen: true, sidebarWidth: 240, kraftDockedWidth: 380 });
    expect(t.columns).toBe("240px 8px minmax(0, 1fr) 388px");
  });

  it("puts the page's left edge after frame padding, sidebar and gap", () => {
    expect(shellTracks({ sidebarOpen: true, sidebarWidth: 240, kraftDockedWidth: 0 }).pageLeft).toBe(
      SHELL_FRAME_PAD + 240 + SHELL_GAP,
    );
    expect(shellTracks({ sidebarOpen: false, sidebarWidth: 300, kraftDockedWidth: 0 }).pageLeft).toBe(72);
  });

  it("ignores a docked Kraft for pageLeft", () => {
    expect(shellTracks({ sidebarOpen: true, sidebarWidth: 260, kraftDockedWidth: 400 }).pageLeft).toBe(276);
  });
});
