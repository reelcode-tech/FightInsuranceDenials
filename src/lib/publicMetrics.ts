export const PUBLIC_STORY_COUNT = 1173;

export function formatPublicStoryCount(value: number = PUBLIC_STORY_COUNT) {
  return value.toLocaleString('en-US');
}

export function normalizePublicStoryCount(value: number | null | undefined) {
  return Number.isFinite(value) && value && value > 0 ? value : PUBLIC_STORY_COUNT;
}
