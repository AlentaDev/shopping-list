import type { Locator, Page } from "@playwright/test";

export class AuthPage {
  readonly page: Page;
  readonly screen: Locator;
  readonly loginForm: Locator;
  readonly registerForm: Locator;
  readonly title: Locator;

  constructor(page: Page) {
    this.page = page;
    this.screen = page.getByTestId("auth-screen");
    this.loginForm = page.getByTestId("login-form");
    this.registerForm = page.getByTestId("register-form");
    this.title = this.screen.getByRole("heading", { level: 1 });
  }

  async gotoLogin(): Promise<void> {
    await this.page.goto("/auth/login");
  }

  async gotoRegister(): Promise<void> {
    await this.page.goto("/auth/register");
  }

  async login(email: string, password: string): Promise<void> {
    await this.loginForm.getByLabel("Email").fill(email);
    await this.loginForm.getByLabel("Contraseña").fill(password);
    await this.loginForm.getByRole("button", { name: "Entrar" }).click();
  }

  async register(
    name: string,
    email: string,
    password: string,
    postalCode: string
  ): Promise<void> {
    await this.registerForm.getByLabel("Nombre").fill(name);
    await this.registerForm.getByLabel("Email").fill(email);
    await this.registerForm.getByLabel("Contraseña").fill(password);
    await this.registerForm
      .getByLabel("Código postal (opcional)")
      .fill(postalCode);
    await this.registerForm
      .getByRole("button", { name: "Registrarme" })
      .click();
  }
}
