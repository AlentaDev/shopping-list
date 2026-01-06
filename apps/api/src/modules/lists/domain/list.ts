export type ListItem = {
  id: string;
  listId: string;
  name: string;
  qty: number;
  checked: boolean;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type List = {
  id: string;
  ownerUserId: string;
  title: string;
  items: ListItem[];
  createdAt: Date;
  updatedAt: Date;
};
