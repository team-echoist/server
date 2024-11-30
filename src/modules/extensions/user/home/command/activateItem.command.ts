export class ActivateItemCommand {
  constructor(
    public readonly userId: number,
    public readonly itemId: number,
  ) {}
}
