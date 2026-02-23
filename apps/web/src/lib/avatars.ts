export type AvatarOption = {
  id: string;
  pattern: number;
  label: string;
};

export const AVATAR_OPTIONS = [
  { id: "avatar-1", pattern: 0, label: "Ocean Blue" },
  { id: "avatar-2", pattern: 1, label: "Sunset Orange" },
  { id: "avatar-3", pattern: 2, label: "Forest Green" },
  { id: "avatar-4", pattern: 3, label: "Golden Yellow" },
  { id: "avatar-5", pattern: 4, label: "Ruby Red" },
  { id: "avatar-6", pattern: 5, label: "Purple Haze" },
  { id: "avatar-7", pattern: 6, label: "Aqua Mint" },
  { id: "avatar-8", pattern: 7, label: "Coral Pink" },
  { id: "avatar-9", pattern: 8, label: "Deep Indigo" },
  { id: "avatar-10", pattern: 9, label: "Lime Green" },
] as const satisfies AvatarOption[];

/** Derived from AVATAR_OPTIONS — adding/removing an entry keeps this in sync automatically. */
export type AvatarId = (typeof AVATAR_OPTIONS)[number]["id"];

export function getAvatarById(id: string): AvatarOption | undefined {
  return AVATAR_OPTIONS.find((avatar) => avatar.id === id);
}
