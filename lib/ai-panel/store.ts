import type { AiPanelMode, AiPanelState, AiTurn } from "./types";

export const initialAiPanelState: AiPanelState = {
  isOpen: false,
  mode: "ask",
  threadId: null,
  turns: [],
};

export type AiPanelAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "toggle" }
  /** `open: false` adds the turn without opening the chat (Kraft's record popover shows it instead). */
  | { type: "addTurn"; turn: { id: string; prompt: string; mode: AiPanelMode }; open?: boolean }
  | { type: "updateTurn"; id: string; patch: Partial<Omit<AiTurn, "id">> }
  | { type: "setMode"; mode: AiPanelMode }
  | { type: "clear" }
  | { type: "setThreadId"; threadId: string | null }
  | { type: "loadTurns"; turns: AiTurn[] };

function newTurn(id: string, prompt: string, mode: AiPanelMode): AiTurn {
  return {
    id,
    prompt,
    status: "streaming",
    mode,
    text: "",
    route: null,
    draft: null,
    emailDraft: null,
    error: null,
    actions: [],
    pendingConfirm: null,
    modeHint: null,
    activeTool: null,
    steps: [],
  };
}

export function aiPanelReducer(state: AiPanelState, action: AiPanelAction): AiPanelState {
  switch (action.type) {
    case "open":
      return { ...state, isOpen: true };
    case "close":
      return { ...state, isOpen: false };
    case "toggle":
      return { ...state, isOpen: !state.isOpen };
    case "addTurn":
      return {
        ...state,
        isOpen: action.open === false ? state.isOpen : true,
        turns: [...state.turns, newTurn(action.turn.id, action.turn.prompt, action.turn.mode)],
      };
    case "updateTurn":
      return {
        ...state,
        turns: state.turns.map((t) => (t.id === action.id ? { ...t, ...action.patch } : t)),
      };
    case "setMode":
      return { ...state, mode: action.mode };
    case "clear":
      return { ...state, turns: [] };
    case "setThreadId":
      return { ...state, threadId: action.threadId };
    case "loadTurns":
      return { ...state, turns: action.turns };
    default:
      return state;
  }
}
