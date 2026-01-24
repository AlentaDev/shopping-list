export type AutosaveItemInput = {
  id: string;
  kind: "manual";
  name: string;
  qty: number;
  checked: boolean;
  note?: string | null;
};

export type AutosaveDraftInput = {
  title: string;
  items: AutosaveItemInput[];
};

export type AutosaveItem = AutosaveItemInput & {
  updatedAt: string;
};

export type AutosaveDraft = {
  id: string;
  title: string;
  items: AutosaveItem[];
  updatedAt: string;
};

export type AutosaveSummary = {
  id: string;
  title: string;
  updatedAt: string;
};
