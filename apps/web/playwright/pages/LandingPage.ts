import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES } from "../lib/constants";
import { BasePage } from "./BasePage";

export class LandingPage extends BasePage {
  readonly heroSection: Locator;
  readonly salonDiscoverySection: Locator;
  readonly categoriesSection: Locator;
  readonly faqSection: Locator;
  readonly header: Locator;
  readonly footer: Locator;
  readonly signupLink: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    super(page);

    this.heroSection = page
      .locator('#hero, section[aria-label="hero"], [data-testid="hero"]')
      .first();
    this.salonDiscoverySection = page.locator("text=Pronađi salon").first();
    this.categoriesSection = page
      .locator("text=Pronađite salon po kategoriji")
      .or(page.locator("text=Kategorije"))
      .first();
    this.faqSection = page
      .locator("text=Pitanja i odgovori")
      .or(page.locator("text=Često postavljena pitanja"))
      .first();
    this.header = page.locator("header").first();
    this.footer = page.locator("footer").first();
    this.signupLink = page.locator('a[href="/signup"]').first();
    this.loginLink = page.locator('a[href="/login"]').first();
  }

  async goto(): Promise<void> {
    await this.navigateTo(ROUTES.HOME);
    await this.waitForPageLoad();
  }

  async expectPageVisible(): Promise<void> {
    await expect(this.header).toBeVisible();
    await expect(this.heroSection).toBeVisible();
    await expect(this.footer).toBeVisible();
  }

  async expectHeaderVisible(): Promise<void> {
    await expect(this.header).toBeVisible();
  }

  async expectFooterVisible(): Promise<void> {
    await expect(this.footer).toBeVisible();
  }

  async expectSignupLinkVisible(): Promise<void> {
    await expect(this.signupLink).toBeVisible();
  }

  async navigateToSignup(): Promise<void> {
    await this.signupLink.click();
    await this.waitForUrl(/\/signup/);
  }

  async navigateToLogin(): Promise<void> {
    await this.loginLink.click();
    await this.waitForUrl(/\/login/);
  }
}

export class SalonDiscoveryPage extends BasePage {
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  /** Salon listing cards: grid of links to `/{salonSlug}` (see SalonCard). */
  readonly salonCardLinks: Locator;
  readonly noResultsMessage: Locator;
  readonly loadMoreButton: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1:has-text("Svi saloni")').first();
    this.searchInput = page
      .locator('input[placeholder*="Pretražite"]')
      .or(page.locator('input[type="search"]'))
      .first();
    this.salonCardLinks = page.locator('[data-testid="salon-card"], main .grid > a[href^="/"]');
    this.noResultsMessage = page
      .locator("text=Nema salona koji odgovaraju")
      .or(page.locator("text=Trenutno nema dostupnih salona"))
      .first();
    this.loadMoreButton = page
      .locator('button:has-text("Ucitaj još")')
      .or(page.locator('button:has-text("Učitaj još")'))
      .first();
  }

  async goto(): Promise<void> {
    await this.navigateTo(ROUTES.SALONI);
    await this.waitForPageLoad();
  }

  async expectPageVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectSearchVisible(): Promise<void> {
    await expect(this.searchInput).toBeVisible();
  }

  async expectAtLeastOneSalonCard(): Promise<void> {
    await expect(this.salonCardLinks.first()).toBeVisible();
  }

  async search(query: string): Promise<void> {
    await this.fillField(this.searchInput, query);
  }

  async expectNoResults(): Promise<void> {
    await expect(this.noResultsMessage).toBeVisible();
  }
}

export class HelpCenterPage extends BasePage {
  readonly pageTitle: Locator;
  readonly searchInput: Locator;
  readonly categoriesGrid: Locator;
  readonly supportLink: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator("text=Kako ti možemo pomoći?").first();
    this.searchInput = page
      .locator('input[placeholder*="Pretraži članke"]')
      .or(page.locator('input[type="search"]'))
      .first();
    this.categoriesGrid = page
      .locator(':has(> h2:text("Kategorije")), :has(> .sr-only:text("Kategorije"))')
      .first();
    this.supportLink = page.locator('a[href="/help/podrska"]').first();
  }

  async goto(): Promise<void> {
    await this.navigateTo(ROUTES.HELP);
    await this.waitForPageLoad();
  }

  async expectPageVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectSearchVisible(): Promise<void> {
    await expect(this.searchInput).toBeVisible();
  }

  async expectCategoriesVisible(): Promise<void> {
    // Verify at least one category card link is visible
    const categoryLink = this.page.locator('a[href^="/help/"]').first();
    await expect(categoryLink).toBeVisible();
  }

  async search(query: string): Promise<void> {
    await this.fillField(this.searchInput, query);
  }

  async expectSupportLinkVisible(): Promise<void> {
    await expect(this.supportLink).toBeVisible();
  }
}

export class FAQPage extends BasePage {
  readonly faqSections: Locator;
  readonly header: Locator;
  readonly footer: Locator;
  readonly supportLink: Locator;

  constructor(page: Page) {
    super(page);

    this.faqSections = page.locator('[data-state], details, [role="region"]').first();
    this.header = page.locator("header").first();
    this.footer = page.locator("footer").first();
    this.supportLink = page.locator('a[href="/help/podrska"]').first();
  }

  async goto(): Promise<void> {
    await this.navigateTo(ROUTES.FAQ);
    await this.waitForPageLoad();
  }

  async expectPageVisible(): Promise<void> {
    await expect(this.header).toBeVisible();
  }

  async expectFAQSectionsVisible(): Promise<void> {
    const sections = this.page.locator("text=Često postavljena pitanja");
    await expect(sections.first()).toBeVisible();
  }

  async expectSupportLinkVisible(): Promise<void> {
    await expect(this.supportLink).toBeVisible();
  }
}
