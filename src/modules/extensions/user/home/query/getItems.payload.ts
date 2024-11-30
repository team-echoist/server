export class GetItemsPayload {
  constructor(
    public readonly userId: number,
    public readonly themeId: number,
    public readonly position: string,
  ) {}
}
