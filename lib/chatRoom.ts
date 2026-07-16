export type ChatRoomItemKind =
  | "trash"
  | "cup"
  | "can"
  | "book"
  | "sock"
  | "toy";

export type ChatRoomFurnitureKind =
  | "trashcan"
  | "sink"
  | "recycling"
  | "bookshelf"
  | "hamper"
  | "toybox";

export interface ChatRoomItem {
  id: string;
  kind: ChatRoomItemKind;
  label: string;
  x: number;
  y: number;
  destination: string;
}

export interface ChatRoomFurniture {
  kind: ChatRoomFurnitureKind;
  x: number;
  y: number;
  label: string;
}

export const CHAT_ROOM_ITEMS: ChatRoomItem[] = [
  {
    id: "chat-c1",
    kind: "sock",
    label: "sock",
    x: 38,
    y: 38,
    destination: "Laundry hamper",
  },
  {
    id: "chat-c2",
    kind: "cup",
    label: "cup",
    x: 62,
    y: 42,
    destination: "Kitchen sink",
  },
  {
    id: "chat-c3",
    kind: "book",
    label: "book",
    x: 45,
    y: 64,
    destination: "Bookshelf",
  },
  {
    id: "chat-c4",
    kind: "toy",
    label: "toy",
    x: 61,
    y: 66,
    destination: "Toy box",
  },
  {
    id: "chat-c5",
    kind: "trash",
    label: "trash",
    x: 40,
    y: 30,
    destination: "Trash can",
  },
  {
    id: "chat-c6",
    kind: "can",
    label: "recycling can",
    x: 66,
    y: 32,
    destination: "Recycling",
  },
  {
    id: "chat-c7",
    kind: "sock",
    label: "sock",
    x: 33,
    y: 54,
    destination: "Laundry hamper",
  },
];

export const CHAT_ROOM_FURNITURE: ChatRoomFurniture[] = [
  { kind: "trashcan", x: 50, y: 16, label: "Trash can" },
  { kind: "sink", x: 16, y: 24, label: "Kitchen sink" },
  { kind: "recycling", x: 84, y: 24, label: "Recycling" },
  { kind: "bookshelf", x: 85, y: 64, label: "Bookshelf" },
  { kind: "hamper", x: 15, y: 66, label: "Laundry hamper" },
  { kind: "toybox", x: 50, y: 85, label: "Toy box" },
];

export function describeChatRoom() {
  const items = CHAT_ROOM_ITEMS.map(
    (item) =>
      `- ${item.id}: ${item.label} at (${item.x}, ${item.y}); belongs at ${item.destination}`,
  ).join("\n");
  const furniture = CHAT_ROOM_FURNITURE.map(
    (piece) => `- ${piece.label} at (${piece.x}, ${piece.y})`,
  ).join("\n");

  return `Room snapshot:
Items still on the floor:
${items}

Available destinations:
${furniture}`;
}

export function firstChatRoomPickup() {
  return [...CHAT_ROOM_ITEMS].sort((a, b) => a.y - b.y || a.x - b.x)[0];
}

export function fallbackChatAnswer(prompt: string) {
  const first = firstChatRoomPickup();
  const needs = CHAT_ROOM_ITEMS.map(
    (item) => `${item.label} -> ${item.destination}`,
  ).join(", ");

  if (/clean|tidy|pick|room|mess/i.test(prompt)) {
    return `I can answer, but I cannot change the room from chat mode. The room needs: ${needs}. First item I would pick up: ${first.label} near (${first.x}, ${first.y}), then I would put it in the ${first.destination}.`;
  }

  return `I can answer from the room snapshot, but chat mode cannot move anything. I see ${CHAT_ROOM_ITEMS.length} floor items and ${CHAT_ROOM_FURNITURE.length} destinations. First item I would pick up: ${first.label} near (${first.x}, ${first.y}) for the ${first.destination}.`;
}
