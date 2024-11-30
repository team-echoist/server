export class BuyItemCommand {
  constructor(
    public readonly userId: number,
    public readonly itemId: number,
  ) {}
}
