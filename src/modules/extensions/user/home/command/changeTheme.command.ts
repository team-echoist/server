export class ChangeThemeCommand {
  constructor(
    public readonly userId: number,
    public readonly themeId: number,
  ) {}
}
