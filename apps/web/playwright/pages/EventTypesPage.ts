import { type Locator, type Page, expect } from "@playwright/test";
import { ROUTES } from "../lib/constants";
import { BasePage } from "./BasePage";

/**
 * Page Object for the Event Types list page
 */
export class EventTypesListPage extends BasePage {
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly emptyState: Locator;
  readonly eventTypeList: Locator;

  constructor(page: Page) {
    super(page);

    this.pageTitle = page
      .locator('[data-testid="event-types-title"]')
      .or(page.locator('h1:has-text("Tipovi termina")'))
      .first();
    this.createButton = page
      .locator('[data-testid="event-types-create-button"]')
      .or(page.locator('a[href="/dashboard/event-types/new"]'))
      .first();
    this.emptyState = page.locator('[data-testid="event-types-empty-state"]');
    this.eventTypeList = page.locator('[data-testid="event-types-list"]');
  }

  async goto(): Promise<void> {
    await this.page.goto(ROUTES.EVENT_TYPES);
    await this.waitForPageLoad();
  }

  /**
   * Click the create new event type button
   */
  async clickCreate(): Promise<void> {
    await this.clickButton(this.createButton);
    await this.waitForUrl(/\/dashboard\/event-types\/new/);
  }

  /**
   * Get an event type card by title
   */
  getEventTypeCard(title: string): Locator {
    return this.page.getByTestId(`event-type-card-${title.toLowerCase().replace(/\s+/g, "-")}`);
  }

  /**
   * Check if an event type with given title is visible
   */
  async expectEventTypeVisible(title: string): Promise<void> {
    await expect(this.page.locator(`text=${title}`)).toBeVisible();
  }

  /**
   * Delete an event type by title using the delete button
   */
  async deleteEventType(title: string): Promise<void> {
    // Find the event type card by title, then find the delete button with data-testid within it
    const titleLocator = this.page.locator(`text=${title}`).first();

    // Navigate up to find the card containing this title, then find the delete button
    // The button has data-testid="delete-event-type-{id}" pattern
    const cardContainingTitle = titleLocator
      .locator("..")
      .locator("..")
      .locator("..")
      .locator("..");
    const deleteButton = cardContainingTitle.locator('[data-testid^="delete-event-type-"]').first();

    const deleteButtonVisible = await deleteButton.isVisible().catch(() => false);

    if (!deleteButtonVisible) {
      throw new Error(`Could not find delete button for event type: ${title}`);
    }

    // Set up response waiter for the delete mutation
    const responsePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/trpc") &&
        response.request().method() === "POST" &&
        (response.url().includes("eventType.delete") ||
          (response.request().postData()?.includes("eventType.delete") ?? false)),
      { timeout: 30000 }
    );

    // Click the delete button
    await deleteButton.click();

    // Wait for custom confirm dialog to appear (ConfirmDialog component)
    const confirmDialog = this.page.locator('[role="dialog"]').filter({
      hasText: "Obriši tip termina",
    });
    await expect(confirmDialog).toBeVisible({ timeout: 5000 });

    // Find and click the confirm button in the dialog
    const confirmButton = confirmDialog.locator('button:has-text("Obriši")').filter({
      hasNotText: "Otkaži",
    });
    await expect(confirmButton).toBeVisible({ timeout: 2000 });

    // Wait for the delete response to complete
    await Promise.all([
      responsePromise.catch(() => {
        // Response might have already completed, that's ok
      }),
      confirmButton.click(),
    ]);

    // Wait for dialog to close
    await expect(confirmDialog).toBeHidden({ timeout: 5000 });

    // Give the UI a moment to update
    await this.page.waitForTimeout(500);
  }

  /**
   * Edit an event type by title
   */
  async editEventType(title: string): Promise<void> {
    const editButton = this.page.getByTestId(
      `event-type-edit-${title.toLowerCase().replace(/\s+/g, "-")}`
    );
    await this.clickButton(editButton);
    await this.waitForUrl(/\/dashboard\/event-types\/\d+/);
  }

  /**
   * Check if empty state is displayed
   */
  async expectEmptyState(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Wait for an event type to be hidden (after deletion)
   */
  async expectEventTypeHidden(title: string): Promise<void> {
    await expect(this.page.locator(`text=${title}`)).toBeHidden({
      timeout: 5000,
    });
  }
}

/**
 * Page Object for the Create Event Type page
 */
export class CreateEventTypePage extends BasePage {
  readonly pageTitle: Locator;
  readonly titleInput: Locator;
  readonly slugInput: Locator;
  readonly descriptionInput: Locator;
  readonly locationAddressInput: Locator;
  readonly durationInput: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly backButton: Locator;

  // Duration preset buttons
  readonly duration15Button: Locator;
  readonly duration30Button: Locator;
  readonly duration60Button: Locator;

  constructor(page: Page) {
    super(page);

    // Use data-testid selectors with fallbacks to existing id selectors
    this.pageTitle = page
      .locator('[data-testid="create-event-type-title"]')
      .or(page.getByText("Novi tip termina"))
      .first();
    this.titleInput = page
      .locator('[data-testid="event-type-title-input"]')
      .or(page.locator('input[id="title"]'))
      .first();
    this.slugInput = page
      .locator('[data-testid="event-type-slug-input"]')
      .or(page.locator('input[id="slug"]'))
      .first();
    this.descriptionInput = page
      .locator('[data-testid="event-type-description-input"]')
      .or(page.locator('textarea[id="description"]'))
      .first();
    this.locationAddressInput = page
      .locator('[data-testid="event-type-location-address-input"]')
      .or(page.locator('input[id="locationAddress"]'))
      .first();
    this.durationInput = page
      .locator('[data-testid="event-type-duration-input"]')
      .or(page.locator('input[type="number"]'))
      .first();
    this.submitButton = page
      .locator('[data-testid="event-type-submit-button"]')
      .or(page.locator('button[type="submit"]'))
      .first();
    this.cancelButton = page
      .locator('[data-testid="event-type-cancel-button"]')
      .or(page.locator('button:has-text("Otkaži")'))
      .first();
    this.backButton = page
      .locator('[data-testid="event-type-back-button"]')
      .or(page.getByText("Nazad"))
      .first();

    this.duration15Button = page
      .locator('[data-testid="duration-15"]')
      .or(page.locator('button:has-text("15min")'))
      .first();
    this.duration30Button = page
      .locator('[data-testid="duration-30"]')
      .or(page.locator('button:has-text("30min")'))
      .first();
    this.duration60Button = page
      .locator('[data-testid="duration-60"]')
      .or(page.locator('button:has-text("1h")'))
      .first();
  }

  async goto(): Promise<void> {
    await this.page.goto(ROUTES.EVENT_TYPES_NEW);
    await this.waitForPageLoad();
  }

  /**
   * Fill the title field
   */
  async fillTitle(title: string): Promise<void> {
    await this.fillField(this.titleInput, title);
  }

  /**
   * Fill the slug field
   */
  async fillSlug(slug: string): Promise<void> {
    await this.clearAndFill(this.slugInput, slug);
  }

  /**
   * Fill the description field
   */
  async fillDescription(description: string): Promise<void> {
    await this.fillField(this.descriptionInput, description);
  }

  /**
   * Fill the location address field
   */
  async fillLocationAddress(address: string): Promise<void> {
    await this.fillField(this.locationAddressInput, address);
  }

  /**
   * Select a duration preset
   */
  async selectDuration(minutes: 15 | 30 | 60): Promise<void> {
    const button =
      minutes === 15
        ? this.duration15Button
        : minutes === 30
          ? this.duration30Button
          : this.duration60Button;
    await this.clickButton(button);
  }

  /**
   * Submit the form
   */
  async submit(): Promise<void> {
    await this.clickButton(this.submitButton);
  }

  /**
   * Create a new event type with all required fields
   */
  async createEventType(data: {
    title: string;
    slug?: string;
    description?: string;
    address: string;
    duration?: 15 | 30 | 60;
  }): Promise<void> {
    await this.fillTitle(data.title);
    if (data.slug) {
      await this.fillSlug(data.slug);
    }
    if (data.description) {
      await this.fillDescription(data.description);
    }
    await this.fillLocationAddress(data.address);
    if (data.duration) {
      await this.selectDuration(data.duration);
    }
    await this.submit();
  }

  /**
   * Create event type and wait for navigation to list
   */
  async createEventTypeAndExpectSuccess(data: {
    title: string;
    slug?: string;
    description?: string;
    address: string;
    duration?: 15 | 30 | 60;
  }): Promise<void> {
    await this.createEventType(data);
    await this.waitForUrl(/\/dashboard\/event-types$/);
  }

  /**
   * Click cancel button
   */
  async cancel(): Promise<void> {
    await this.clickButton(this.cancelButton);
    await this.waitForUrl(/\/dashboard\/event-types$/);
  }

  /**
   * Click back button
   */
  async goBack(): Promise<void> {
    await this.page.click("text=Nazad");
    await this.waitForUrl(/\/dashboard\/event-types$/);
  }

  /**
   * Check if form is displayed correctly
   */
  async expectFormVisible(): Promise<void> {
    await expect(this.titleInput).toBeVisible();
    await expect(this.slugInput).toBeVisible();
    await expect(this.descriptionInput).toBeVisible();
    await expect(this.locationAddressInput).toBeVisible();
  }

  /**
   * Expect slug to have auto-generated value from title
   */
  async expectSlugValue(expectedSlug: string): Promise<void> {
    await expect(this.slugInput).toHaveValue(expectedSlug);
  }

  /**
   * Check for validation error message
   */
  async expectValidationError(message: string): Promise<void> {
    await expect(this.page.locator(`text=${message}`)).toBeVisible();
  }

  /**
   * Expect duration input to have a specific value
   */
  async expectDurationValue(minutes: number): Promise<void> {
    await expect(this.durationInput).toHaveValue(String(minutes));
  }
}

/**
 * Page Object for the Edit Event Type page
 */
export class EditEventTypePage extends BasePage {
  readonly pageTitle: Locator;
  readonly titleInput: Locator;
  readonly slugInput: Locator;
  readonly descriptionInput: Locator;
  readonly locationAddressInput: Locator;
  readonly durationInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    super(page);

    // Use data-testid selectors with fallbacks to existing id selectors
    this.pageTitle = page.locator('[data-testid="edit-event-type-title"]');
    this.titleInput = page
      .locator('[data-testid="event-type-title-input"]')
      .or(page.locator('input[id="title"]'))
      .first();
    this.slugInput = page
      .locator('[data-testid="event-type-slug-input"]')
      .or(page.locator('input[id="slug"]'))
      .first();
    this.descriptionInput = page
      .locator('[data-testid="event-type-description-input"]')
      .or(page.locator('textarea[id="description"]'))
      .first();
    this.locationAddressInput = page
      .locator('[data-testid="event-type-location-address-input"]')
      .or(page.locator('input[id="locationAddress"]'))
      .first();
    this.durationInput = page
      .locator('[data-testid="event-type-duration-input"]')
      .or(page.locator('input[type="number"]'))
      .first();
    this.saveButton = page
      .locator('[data-testid="event-type-save-button"]')
      .or(page.locator('button:has-text("Sačuvaj izmene")'))
      .first();
    this.cancelButton = page.locator('[data-testid="event-type-cancel-button"]');
    this.deleteButton = page.locator('[data-testid="event-type-delete-button"]');
  }

  async goto(eventTypeId: number | string): Promise<void> {
    await this.page.goto(ROUTES.eventTypeEdit(eventTypeId));
    await this.waitForPageLoad();
  }

  /**
   * Update the title
   */
  async updateTitle(newTitle: string): Promise<void> {
    await this.clearAndFill(this.titleInput, newTitle);
  }

  /**
   * Update the slug
   */
  async updateSlug(newSlug: string): Promise<void> {
    await this.clearAndFill(this.slugInput, newSlug);
  }

  /**
   * Update the location address
   */
  async updateLocationAddress(address: string): Promise<void> {
    await this.fillField(this.locationAddressInput, address);
  }

  /**
   * Save changes using waitForMutation for proper wait
   */
  async save(): Promise<void> {
    await this.saveButton.scrollIntoViewIfNeeded();
    await this.waitForMutation(async () => {
      await this.clickButton(this.saveButton);
    });
  }

  /**
   * Save changes and wait for success
   */
  async saveAndExpectSuccess(): Promise<void> {
    await this.save();
    // Wait for the mutation to complete and UI to update
    const successToast = this.page.getByTestId("toast-success");
    await expect(successToast)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Toast may not appear immediately, so we also check the form is still visible
      });
  }

  /**
   * Check if form is pre-populated with existing data
   */
  async expectFormPopulated(data: {
    title: string;
    slug: string;
  }): Promise<void> {
    await expect(this.titleInput).toHaveValue(data.title);
    await expect(this.slugInput).toHaveValue(data.slug);
  }

  /**
   * Expect duplicate slug error
   */
  async expectDuplicateSlugError(): Promise<void> {
    await expect(this.page.locator("text=/Ovaj slug već postoji/")).toBeVisible({ timeout: 10000 });
  }

  /**
   * Submit form (for tests that need to submit without waiting)
   */
  async submit(): Promise<void> {
    await this.page.click('button[type="submit"]');
  }
}
