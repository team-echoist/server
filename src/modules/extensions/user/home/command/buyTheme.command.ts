export class BuyThemeCommand {
  constructor(
    public readonly userId: number,
    public readonly themeId: number,
  ) {}
}
