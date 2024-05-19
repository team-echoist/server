export interface FindMyEssayQueryInterface {
  author: { id: number };
  linkedOut: boolean;
  category?: { id: number };
  published?: boolean;
}
