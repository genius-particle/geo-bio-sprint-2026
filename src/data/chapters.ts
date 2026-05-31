export const CHAPTERS = {
  geography: {
    '八年级上册': ['从世界看中国', '中国的自然环境', '中国的自然资源', '中国的经济发展'],
    '八年级下册': ['中国的地理差异', '北方地区', '南方地区', '西北地区', '青藏地区'],
  },
  biology: {
    '八年级上册': ['生物圈中的绿色植物', '生物圈中的动物', '生物圈中的微生物'],
    '八年级下册': ['生物的生殖和发育', '生物的遗传和变异', '生命起源和生物进化', '健康地生活'],
  },
} as const;

export type Subject = 'geography' | 'biology';

export function getChapterList(subject: Subject): string[] {
  const data = CHAPTERS[subject];
  return Object.values(data).flat();
}
