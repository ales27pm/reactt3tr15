import { NativeEventEmitter, NativeModules, Platform, Vibration } from "react-native";
import type { EmitterSubscription, NativeModule } from "react-native";
import { logDebug, logError, logInfo, logWarn } from "./logger";
import { useTetrisStore } from "../state/tetrisStore";
import { playSfx, type SfxName } from "./sfx";

const CONTEXT = "controller";
const MODULE_CANDIDATE_NAMES = ["RNGameController", "RNGamepad", "GameControllerModule", "GameController"] as const;
const HORIZONTAL_THRESHOLD = 0.45;
const VERTICAL_THRESHOLD = 0.45;

export const isControllerDebugEnabled = process.env.EXPO_PUBLIC_ENABLE_CONTROLLER_DEBUG === "1";

export type GamepadEventPayload = {
  readonly type?: string;
  readonly name?: string;
  readonly button?: string;
  readonly control?: string;
  readonly code?: string;
  readonly axis?: string | number;
  readonly x?: number;
  readonly y?: number;
  readonly value?: number;
  readonly values?: number[];
  readonly pressed?: boolean;
  readonly state?: { x?: number | null; y?: number | null } | null;
  readonly axes?: number[];
  readonly id?: string | number;
  readonly [key: string]: unknown;
};

type InternalEventType = "button" | "axis" | "connected" | "disconnected" | "unknown";

type InternalGamepadEvent = GamepadEventPayload & {
  readonly forcedType?: InternalEventType;
  readonly forcedPressed?: boolean;
  readonly eventName?: string;
};

type Direction = "left" | "right" | "down";
type GamepadLogicalButton = "rotate" | "hardDrop" | "hold" | "softDrop" | "pause" | "reset";

type Timer = ReturnType<typeof setTimeout> | null;
type Interval = ReturnType<typeof setInterval> | null;

class RepeatAction {
  private holdTimeout: Timer = null;
  private repeatInterval: Interval = null;
  private readonly perform: () => void;

  constructor(perform: () => void) {
    this.perform = perform;
  }

  start(initialDelay: number, repeatDelay: number) {
    if (this.holdTimeout || this.repeatInterval) {
      return;
    }
    try {
      this.perform();
    } catch (error) {
      logError("Failed to perform repeated controller action", { context: CONTEXT }, error);
    }
    const safeInitial = Math.max(0, Number.isFinite(initialDelay) ? initialDelay : 0);
    const safeRepeat = Math.max(10, Number.isFinite(repeatDelay) ? repeatDelay : 10);
    this.holdTimeout = setTimeout(() => {
      this.repeatInterval = setInterval(() => {
        try {
          this.perform();
        } catch (error) {
          logError("Failed to perform repeated controller action", { context: CONTEXT }, error);
        }
      }, safeRepeat);
    }, safeInitial);
  }

  stop() {
    if (this.holdTimeout) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }
    if (this.repeatInterval) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = null;
    }
  }

  dispose() {
    this.stop();
  }
}

const DPAD_ALIASES: Record<string, Direction | "up"> = {
  dpadleft: "left",
  left: "left",
  hatleft: "left",
  arrowleft: "left",
  keyleft: "left",
  padleft: "left",
  dpadright: "right",
  right: "right",
  hatright: "right",
  arrowright: "right",
  keyright: "right",
  padright: "right",
  dpaddown: "down",
  down: "down",
  hatdown: "down",
  arrowdown: "down",
  keydown: "down",
  paddown: "down",
  dpadup: "up",
  up: "up",
  hatup: "up",
  arrowup: "up",
  keyup: "up",
  padup: "up",
};

const BUTTON_ALIASES: Record<string, GamepadLogicalButton> = {
  a: "rotate",
  buttona: "rotate",
  buttonsouth: "rotate",
  cross: "rotate",
  b: "hardDrop",
  buttoneast: "hardDrop",
  circle: "hardDrop",
  r1: "hardDrop",
  rb: "hardDrop",
  rightbumper: "hardDrop",
  rightshoulder: "hardDrop",
  rtrigger: "hardDrop",
  rt: "hardDrop",
  r2: "hardDrop",
  y: "rotate",
  buttonnorth: "rotate",
  triangle: "rotate",
  x: "hold",
  buttonwest: "hold",
  square: "hold",
  l1: "hold",
  lb: "hold",
  leftbumper: "hold",
  leftshoulder: "hold",
  ltrigger: "softDrop",
  lt: "softDrop",
  l2: "softDrop",
  buttons: "pause",
  start: "pause",
  options: "pause",
  menu: "pause",
  plus: "pause",
  buttontl: "pause",
  select: "reset",
  back: "reset",
  minus: "reset",
  share: "reset",
};

const AXIS_ALIASES: Record<string, "x" | "y"> = {
  x: "x",
  axisx: "x",
  leftx: "x",
  lx: "x",
  horizontal: "x",
  axis0: "x",
  "0": "x",
  dpax: "x",
  dpadx: "x",
  hatx: "x",
  y: "y",
  axisy: "y",
  lefty: "y",
  ly: "y",
  vertical: "y",
  axis1: "y",
  "1": "y",
  dpay: "y",
  dpady: "y",
  haty: "y",
};

const EVENT_DEFINITIONS: readonly { name: string; type: InternalEventType; pressed?: boolean }[] = [
  { name: "GCControllerButtonValueChanged", type: "button" },
  { name: "GameControllerButtonDown", type: "button", pressed: true },
  { name: "GameControllerButtonUp", type: "button", pressed: false },
  { name: "gamepadButtonDown", type: "button", pressed: true },
  { name: "gamepadButtonUp", type: "button", pressed: false },
  { name: "gamepadButtonChange", type: "button" },
  { name: "GameControllerButtonChanged", type: "button" },
  { name: "GCControllerAxisValueChanged", type: "axis" },
  { name: "gamepadAxisChanged", type: "axis" },
  { name: "GameControllerAxisChanged", type: "axis" },
  { name: "controllerConnected", type: "connected" },
  { name: "controllerDisconnected", type: "disconnected" },
  { name: "GCControllerDidConnect", type: "connected" },
  { name: "GCControllerDidDisconnect", type: "disconnected" },
];

const syntheticListeners = new Set<(event: InternalGamepadEvent) => void>();

const normalizeControlName = (raw?: unknown): string | undefined => {
  if (typeof raw === "string") {
    return raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  if (typeof raw === "number") {
    return String(raw);
  }
  return undefined;
};

type StoreState = ReturnType<typeof useTetrisStore.getState>;

const vibrateIfEnabled = (state: StoreState, duration: number) => {
  if (!state.enableHaptics) {
    return;
  }
  if (Platform.OS === "ios") {
    Vibration.vibrate(duration);
  }
};

const playIfEnabled = (state: StoreState, sfx: SfxName) => {
  if (state.enableSfx) {
    playSfx(sfx);
  }
};

const runWithState = (
  fn: (state: StoreState) => void,
  options: { allowPaused?: boolean; allowGameOver?: boolean } = {},
) => {
  const state = useTetrisStore.getState();
  if (!options.allowPaused && state.paused) {
    return;
  }
  if (!options.allowGameOver && state.gameOver) {
    return;
  }
  fn(state);
};

const moveLeft = () =>
  runWithState((state) => {
    state.movePiece("left");
    vibrateIfEnabled(state, 10);
    playIfEnabled(state, "move");
  });

const moveRight = () =>
  runWithState((state) => {
    state.movePiece("right");
    vibrateIfEnabled(state, 10);
    playIfEnabled(state, "move");
  });

const softDrop = () =>
  runWithState((state) => {
    state.dropPiece();
    playIfEnabled(state, "soft");
  });

const hardDrop = () =>
  runWithState((state) => {
    state.hardDrop();
    vibrateIfEnabled(state, 50);
    playIfEnabled(state, "hard");
  });

const rotate = () =>
  runWithState((state) => {
    state.rotatePiece();
    vibrateIfEnabled(state, 10);
    playIfEnabled(state, "rotate");
  });

const holdPiece = () =>
  runWithState((state) => {
    state.holdSwap();
    playIfEnabled(state, "hold");
  });

const togglePause = () => runWithState((state) => state.pauseGame(), { allowPaused: true });

const resetGame = () =>
  runWithState(
    (state) => {
      state.resetGame();
    },
    { allowPaused: true, allowGameOver: true },
  );

const getTimingForDirection = (direction: Direction) => {
  const { dasMs, arrMs } = useTetrisStore.getState();
  const das = Math.max(0, typeof dasMs === "number" ? dasMs : 160);
  const arr = Math.max(10, typeof arrMs === "number" ? arrMs : 40);
  if (direction === "down") {
    const initial = Math.max(30, Math.min(das * 0.75, 120));
    const repeat = Math.max(20, Math.min(arr, 100));
    return { initial, repeat };
  }
  return { initial: das, repeat: arr };
};

const clampAxisValue = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value > 1) return 1;
  if (value < -1) return -1;
  return value;
};

const resolveAxisValue = (payload: InternalGamepadEvent, axis: "x" | "y"): number | null => {
  if (payload.state && typeof payload.state === "object") {
    const raw = axis === "x" ? payload.state.x : payload.state.y;
    if (typeof raw === "number") {
      return clampAxisValue(raw);
    }
  }
  if (typeof payload[axis] === "number") {
    return clampAxisValue(payload[axis] as number);
  }
  if (Array.isArray(payload.axes)) {
    const index = axis === "x" ? 0 : 1;
    const raw = payload.axes[index];
    if (typeof raw === "number") {
      return clampAxisValue(raw);
    }
  }
  const valuesArray = Array.isArray(payload.values) ? payload.values : undefined;
  if (valuesArray) {
    const index = axis === "x" ? 0 : 1;
    const raw = valuesArray[index];
    if (typeof raw === "number") {
      return clampAxisValue(raw);
    }
  }
  if (typeof payload.axis === "string" || typeof payload.axis === "number") {
    const normalized = normalizeControlName(payload.axis);
    if (normalized) {
      const resolved = AXIS_ALIASES[normalized];
      if (resolved === axis && typeof payload.value === "number") {
        return clampAxisValue(payload.value);
      }
    }
  }
  return null;
};

const guessEventType = (payload: InternalGamepadEvent): InternalEventType => {
  if (payload.forcedType) {
    return payload.forcedType;
  }
  const explicitType = typeof payload.type === "string" ? payload.type.toLowerCase() : undefined;
  if (
    explicitType === "button" ||
    explicitType === "axis" ||
    explicitType === "connected" ||
    explicitType === "disconnected"
  ) {
    return explicitType;
  }
  if (
    typeof payload.pressed === "boolean" ||
    typeof payload.button === "string" ||
    typeof payload.control === "string" ||
    typeof payload.code === "string"
  ) {
    return "button";
  }
  if (
    typeof payload.x === "number" ||
    typeof payload.y === "number" ||
    typeof payload.axis === "string" ||
    typeof payload.value === "number" ||
    Array.isArray(payload.axes)
  ) {
    return "axis";
  }
  if (payload.eventName?.toLowerCase().includes("connect")) {
    return payload.eventName.toLowerCase().includes("disconnect") ? "disconnected" : "connected";
  }
  return "unknown";
};

const resolvePressed = (payload: InternalGamepadEvent): boolean | undefined => {
  if (typeof payload.forcedPressed === "boolean") {
    return payload.forcedPressed;
  }
  if (typeof payload.pressed === "boolean") {
    return payload.pressed;
  }
  if (typeof payload.value === "number") {
    if (payload.value >= 0.75) return true;
    if (payload.value <= 0.25) return false;
  }
  return undefined;
};

const resolveControlName = (payload: InternalGamepadEvent): string | undefined => {
  return (
    normalizeControlName(payload.button) ||
    normalizeControlName(payload.control) ||
    normalizeControlName(payload.code) ||
    normalizeControlName(payload.name)
  );
};

const resolveNativeModule = (): NativeModule | null => {
  const modules = NativeModules as Record<string, unknown>;
  for (const name of MODULE_CANDIDATE_NAMES) {
    const mod = modules[name];
    if (mod && typeof mod === "object") {
      return mod as NativeModule;
    }
  }
  return null;
};

class GamepadInputAdapter {
  private readonly repeaters: Record<Direction, RepeatAction> = {
    left: new RepeatAction(moveLeft),
    right: new RepeatAction(moveRight),
    down: new RepeatAction(softDrop),
  };

  private analogHorizontal: Direction | null = null;
  private analogDownActive = false;
  private analogUpTriggered = false;

  dispatch(event: InternalGamepadEvent) {
    const type = guessEventType(event);
    switch (type) {
      case "button":
        this.handleButton(event);
        break;
      case "axis":
        this.handleAxis(event);
        break;
      case "connected":
        this.handleConnection(true, event);
        break;
      case "disconnected":
        this.handleConnection(false, event);
        break;
      default:
        logDebug(`Ignoring unsupported gamepad event: ${event.eventName ?? "unknown"}`, { context: CONTEXT });
        break;
    }
  }

  dispose() {
    Object.values(this.repeaters).forEach((repeater) => repeater.dispose());
    this.analogHorizontal = null;
    this.analogDownActive = false;
    this.analogUpTriggered = false;
  }

  private handleConnection(connected: boolean, event: InternalGamepadEvent) {
    const label = connected ? "connected" : "disconnected";
    const identifier = event.id ?? event.name ?? event.button ?? "unknown";
    logInfo(`Game controller ${label}: ${identifier}`, { context: CONTEXT });
    if (!connected) {
      Object.values(this.repeaters).forEach((repeater) => repeater.stop());
      this.analogHorizontal = null;
      this.analogDownActive = false;
      this.analogUpTriggered = false;
    }
  }

  private handleButton(event: InternalGamepadEvent) {
    const controlName = resolveControlName(event);
    if (!controlName) {
      logDebug("Received controller button event without a control identifier", { context: CONTEXT });
      return;
    }

    const pressed = resolvePressed(event);
    const dpadTarget = DPAD_ALIASES[controlName];
    if (dpadTarget) {
      if (dpadTarget === "up") {
        if (pressed !== false) {
          rotate();
        }
        if (pressed === false) {
          this.analogUpTriggered = false;
        }
      } else {
        if (pressed !== false) {
          this.updateDigitalDirection(dpadTarget, true);
        }
        if (pressed === false) {
          this.updateDigitalDirection(dpadTarget, false);
        }
      }
      return;
    }

    const logical = BUTTON_ALIASES[controlName];
    if (!logical) {
      logDebug(`Unhandled controller button: ${controlName}`, { context: CONTEXT });
      return;
    }

    this.handleLogicalButton(logical, pressed !== false);
  }

  private handleLogicalButton(logical: GamepadLogicalButton, pressed: boolean) {
    switch (logical) {
      case "rotate":
        if (pressed) rotate();
        break;
      case "hardDrop":
        if (pressed) hardDrop();
        break;
      case "hold":
        if (pressed) holdPiece();
        break;
      case "softDrop":
        this.updateDigitalDirection("down", pressed);
        break;
      case "pause":
        if (pressed) togglePause();
        break;
      case "reset":
        if (pressed) resetGame();
        break;
      default:
        break;
    }
  }

  private handleAxis(event: InternalGamepadEvent) {
    const horizontal = resolveAxisValue(event, "x");
    if (horizontal !== null) {
      this.updateAnalogHorizontal(horizontal);
    }

    const vertical = resolveAxisValue(event, "y");
    if (vertical !== null) {
      this.updateAnalogVertical(vertical);
    }
  }

  private updateAnalogHorizontal(value: number) {
    if (value <= -HORIZONTAL_THRESHOLD) {
      if (this.analogHorizontal !== "left") {
        this.updateDigitalDirection("left", true);
        this.analogHorizontal = "left";
      }
      return;
    }
    if (value >= HORIZONTAL_THRESHOLD) {
      if (this.analogHorizontal !== "right") {
        this.updateDigitalDirection("right", true);
        this.analogHorizontal = "right";
      }
      return;
    }
    if (this.analogHorizontal) {
      this.updateDigitalDirection(this.analogHorizontal, false);
      this.analogHorizontal = null;
    }
  }

  private updateAnalogVertical(value: number) {
    if (value >= VERTICAL_THRESHOLD) {
      if (!this.analogDownActive) {
        this.updateDigitalDirection("down", true);
        this.analogDownActive = true;
      }
    } else if (this.analogDownActive) {
      this.updateDigitalDirection("down", false);
      this.analogDownActive = false;
    }

    if (value <= -VERTICAL_THRESHOLD) {
      if (!this.analogUpTriggered) {
        rotate();
        this.analogUpTriggered = true;
      }
    } else {
      this.analogUpTriggered = false;
    }
  }

  private updateDigitalDirection(direction: Direction, pressed: boolean) {
    const { initial, repeat } = getTimingForDirection(direction);
    if (pressed) {
      if (direction === "left") {
        this.repeaters.right.stop();
      } else if (direction === "right") {
        this.repeaters.left.stop();
      }
      this.repeaters[direction].start(initial, repeat);
    } else {
      this.repeaters[direction].stop();
      if (direction === "left" || direction === "right") {
        if (this.analogHorizontal === direction) {
          this.analogHorizontal = null;
        }
      }
      if (direction === "down") {
        this.analogDownActive = false;
      }
    }
  }
}

export interface GameControllerRegistration {
  dispose: () => void;
}

export const registerGameControllerInput = (): GameControllerRegistration | null => {
  const nativeModule = resolveNativeModule();
  let emitter: NativeEventEmitter | null = null;
  if (nativeModule) {
    emitter = new NativeEventEmitter(nativeModule);
  } else {
    logWarn("No native game controller module detected; relying on synthetic events only", { context: CONTEXT });
  }

  const adapter = new GamepadInputAdapter();
  const subscriptions: EmitterSubscription[] = [];

  if (emitter) {
    for (const definition of EVENT_DEFINITIONS) {
      try {
        const subscription = emitter.addListener(definition.name, (payload: GamepadEventPayload) => {
          try {
            adapter.dispatch({
              ...payload,
              forcedType: definition.type,
              forcedPressed: definition.pressed,
              eventName: definition.name,
            });
          } catch (error) {
            logError(`Failed to handle controller event: ${definition.name}`, { context: CONTEXT }, error);
          }
        });
        subscriptions.push(subscription);
      } catch (error) {
        logError(`Failed to register controller listener for ${definition.name}`, { context: CONTEXT }, error);
      }
    }

    if (subscriptions.length > 0) {
      logInfo(`Registered ${subscriptions.length} native controller listeners`, { context: CONTEXT });
    }
  }

  const syntheticListener = (event: InternalGamepadEvent) => {
    try {
      adapter.dispatch(event);
    } catch (error) {
      logError("Failed to handle synthetic controller event", { context: CONTEXT }, error);
    }
  };

  syntheticListeners.add(syntheticListener);

  return {
    dispose: () => {
      subscriptions.forEach((subscription) => subscription.remove());
      syntheticListeners.delete(syntheticListener);
      adapter.dispose();
      logInfo("Game controller input adapter disposed", { context: CONTEXT });
    },
  };
};

export const dispatchSyntheticGamepadEvent = (event: GamepadEventPayload) => {
  if (syntheticListeners.size === 0) {
    logWarn("No active controller adapters to receive synthetic events", { context: CONTEXT });
    return;
  }
  const payload: InternalGamepadEvent = { ...event };
  Array.from(syntheticListeners).forEach((listener) => listener(payload));
};
