export const IMPERATIVE_API = [
  'blur',
  'checkValidity',
  'click',
  'focus',
  'select',
  'setCustomValidity',
  'setSelectionRange',
  'setRangeText',
] as const;

export type ImperativeAPI = (typeof IMPERATIVE_API)[number];

type FunctionMap = {
  blur: () => void;
  checkValidity: () => boolean;
  click: () => void;
  focus: () => void;
  select: () => void;
  setCustomValidity: (error: string) => void;
  setSelectionRange: (
    start: number | null,
    end: number | null,
    direction?: 'none' | 'forward' | 'backward' | undefined,
  ) => void;
  setRangeText: (replacement: string) => void;
};

export type ImperativeAPIRef = {
  [K in ImperativeAPI]: FunctionMap[K];
};
