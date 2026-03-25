import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES } from "../lib/constants";
import { BasePage } from "./BasePage";

export class OutOfOfficePage extends BasePage {
  readonly pageTitle: Locator;
  readonly addPeriodButton: Locator;
  readonly emptyState: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page.locator('h1:has-text("Van kancelarije")').first();
    this.addPeriodButton = page.locator('button:has-text("Dodaj period")').first();
    this.emptyState = page.locator("text=Nemate zakazanih odsustva").first();
    this.successMessage = page.locator("text=Uspesno sacuvano!").first();
  }

  async goto(): Promise<void> {
    await this.navigateTo(ROUTES.SETTINGS_OUT_OF_OFFICE);
    await this.waitForPageLoad();
  }

  async expectPageVisible(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  async openAddDialog(): Promise<void> {
    await this.clickButton(this.addPeriodButton);
    const dialog = this.page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible();
  }

  async selectDateRange(startDay: number, endDay: number): Promise<void> {
    // The dialog uses react-day-picker v9 Calendar with mode="range"
    // v9 renders days as buttons inside [role="gridcell"] divs (CSS grid, no <td>)
    const dialog = this.page.locator('[role="dialog"]');

    const startButton = dialog.locator(`[role="gridcell"] button:has-text("${startDay}")`).first();
    await startButton.click();

    const endButton = dialog.locator(`[role="gridcell"] button:has-text("${endDay}")`).first();
    await endButton.click();
  }

  async selectReason(): Promise<void> {
    // ReasonSelector uses a grid of buttons, not a select/combobox
    const dialog = this.page.locator('[role="dialog"]');
    const reasonButton = dialog.locator("button.rounded-lg:has(span)").first();
    if (await this.isVisible(reasonButton)) {
      await reasonButton.click();
    }
  }

  async fillNotes(notes: string): Promise<void> {
    const notesInput = this.page.locator('[role="dialog"] textarea[id="notes"]').first();
    if (await this.isVisible(notesInput)) {
      await this.fillField(notesInput, notes);
    }
  }

  async submitDialog(): Promise<void> {
    const submitButton = this.page
      .locator('[role="dialog"] button:has-text("Dodaj")')
      .or(this.page.locator('[role="dialog"] button:has-text("Sacuvaj izmene")'))
      .first();
    await this.waitForMutation(async () => {
      await this.clickButton(submitButton);
    });
  }

  async expectSuccessMessage(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
  }

  async expectEntryVisible(text: string): Promise<void> {
    await expect(this.page.locator(`text=${text}`).first()).toBeVisible();
  }

  async deleteFirstEntry(): Promise<void> {
    // Delete button contains a Trash2 icon from lucide-react
    const deleteButton = this.page
      .locator("button:has(svg.lucide-trash-2)")
      .or(this.page.locator("button:has(svg.lucide-trash)"))
      .first();
    await this.clickButton(deleteButton);

    // Confirm deletion dialog
    const confirmButton = this.page
      .locator('[role="dialog"] button:has-text("Obrisi")')
      .or(this.page.locator('[role="dialog"] button:has-text("Obriši")'))
      .first();
    await this.waitForMutation(async () => {
      await this.clickButton(confirmButton);
    });
  }
}
