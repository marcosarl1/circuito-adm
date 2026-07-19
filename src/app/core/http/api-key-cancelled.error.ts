export class ApiKeyCancelledError extends Error {
  constructor() {
    super("Operação cancelada pelo usuário");
    this.name = "ApiKeyCancelledError";
  }
}
