// Utils
export { cn } from "./utils";

// Atoms
export { Button, buttonVariants } from "./atoms/Button";
export { Input } from "./atoms/Input";
export { Textarea } from "./atoms/Textarea";
export { Label } from "./atoms/Label";
export { ColorPicker, PRESET_COLORS, DARK_PRESET_COLORS } from "./atoms/ColorPicker";
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./atoms/Card";
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./atoms/Dialog";
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./atoms/Accordion";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./atoms/Select";
export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "./atoms/InputOTP";
export { Switch } from "./atoms/Switch";
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./atoms/Popover";
export { ScrollArea, ScrollBar } from "./atoms/ScrollArea";
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "./atoms/Command";
export { PhoneInput } from "./atoms/PhoneInput";
export { Checkbox } from "./atoms/Checkbox";
export { GoogleIcon } from "./atoms/Icons";
export { FormErrorMessage } from "./atoms/FormErrorMessage";
export { ServerErrorAlert } from "./atoms/ServerErrorAlert";
export { LoadingButton } from "./atoms/LoadingButton";
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./atoms/Tooltip";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./atoms/DropdownMenu";
export { Separator } from "./atoms/Separator";
export { Calendar, type CalendarProps } from "./atoms/Calendar";

// Molecules - Auth
export { AuthHeader } from "./molecules/auth/AuthHeader";

// Molecules - Forms
export { DurationSelector, DURATION_OPTIONS } from "./molecules/forms/DurationSelector";
export { FormSection } from "./molecules/forms/FormSection";
export { SelectField, type SelectOption } from "./molecules/forms/SelectField";
export { SignupHeader } from "./molecules/forms/SignupHeader";
export { SignupProgressSteps } from "./molecules/forms/SignupProgressSteps";
export { SignupFormField } from "./molecules/forms/SignupFormField";
export { SignupFormSection } from "./molecules/forms/SignupFormSection";
export { GoogleSearchSection } from "./molecules/forms/GoogleSearchSection";
export { SalonInfoSection } from "./molecules/forms/SalonInfoSection";
export { OwnerInfoSection } from "./molecules/forms/OwnerInfoSection";

// Molecules - Google Places
export { GooglePlacesSearch, type PlaceResult } from "./molecules/google-places/GooglePlacesSearch";

// Molecules - Status
export { StatusBadge } from "./molecules/status/StatusBadge";

// Molecules - Display
export { DateTimeDisplay } from "./molecules/display/DateTimeDisplay";
export { TimeRangeDisplay } from "./molecules/display/TimeRangeDisplay";
export { LocationDisplay } from "./molecules/display/LocationDisplay";

// Molecules - User
export { UserAvatar } from "./molecules/user/UserAvatar";
export { UserInfoDisplay } from "./molecules/user/UserInfoDisplay";

// Molecules - Empty States
export { EmptyState } from "./molecules/empty-states/EmptyState";

// Molecules - Navigation
export { NavItem } from "./molecules/navigation/NavItem";
export { MobileNavItem } from "./molecules/navigation/MobileNavItem";
export { SidebarNavItem } from "./molecules/navigation/SidebarNavItem";
export { SidebarUserDropdown } from "./molecules/navigation/SidebarUserDropdown";
export { SidebarFooter } from "./molecules/navigation/SidebarFooter";
export { MobileBottomNav } from "./molecules/navigation/MobileBottomNav";
export { MobileTopBar } from "./molecules/navigation/MobileTopBar";
export { MobileSettingsNav } from "./molecules/navigation/MobileSettingsNav";

// Molecules - Filters
export { TabFilter } from "./molecules/filters/TabFilter";

// Molecules - Availability
export {
  CopyTimesDropdown,
  DateOverrideDialog,
  DateOverrideItem,
  DayAvailabilityRow,
  ScheduleListItem,
  TimeRangeInput,
  TimezoneSelector,
  type CopyTimesDropdownProps,
  type DateOverrideDialogProps,
  type DateOverrideItemProps,
  type DayAvailabilityRowProps,
  type ScheduleListItemProps,
  type TimeRange,
  type TimeRangeInputProps,
  type TimezoneSelectorProps,
} from "./molecules/availability";

// Molecules - Dialogs
export { CancelBookingDialog } from "./molecules/dialogs/CancelBookingDialog";
export { ConfirmDialog } from "./molecules/dialogs/ConfirmDialog";
export { DeleteAccountDialog } from "./molecules/dialogs/DeleteAccountDialog";
export { RejectBookingDialog } from "./molecules/dialogs/RejectBookingDialog";

// Molecules - Settings
export { ThemeOption } from "./molecules/settings/ThemeOption";
export { ThemeSelector, type Theme } from "./molecules/settings/ThemeSelector";
export { BrandColorSection } from "./molecules/settings/BrandColorSection";
export { BookingPreview } from "./molecules/settings/BookingPreview";

// Molecules - Landing
export { FeatureCard } from "./molecules/landing/FeatureCard";
export { StatDisplay } from "./molecules/landing/StatDisplay";
export { ProcessStep } from "./molecules/landing/ProcessStep";
export { PricingCard } from "./molecules/landing/PricingCard";
export { FooterColumn } from "./molecules/landing/FooterColumn";
export { TrialBadge } from "./molecules/landing/TrialBadge";
export { NavLink } from "./molecules/landing/NavLink";

// Organisms - Navigation
/** @deprecated Use DashboardShell instead */
export { DashboardNav } from "./organisms/navigation/DashboardNav";
export { DashboardSidebar } from "./organisms/navigation/DashboardSidebar";
export { DashboardMobileNav } from "./organisms/navigation/DashboardMobileNav";
export { DashboardShell } from "./organisms/navigation/DashboardShell";
export { SettingsSidebar } from "./organisms/navigation/SettingsSidebar";

// Organisms - Auth
export { SignupForm } from "./organisms/auth/SignupForm";

// Organisms - Dashboard
export { TrialBanner } from "./organisms/dashboard/TrialBanner";

// Organisms - Bookings
export { BookingsClient } from "./organisms/bookings/BookingsClient";

// Organisms - Event Types
export { EventTypesClient } from "./organisms/event-types/EventTypesClient";
export { NewEventTypeClient } from "./organisms/event-types/NewEventTypeClient";
export { EditEventTypeClient } from "./organisms/event-types/EditEventTypeClient";

// Organisms - Availability
export { AvailabilityClient } from "./organisms/availability/AvailabilityClient";
export { AvailabilityListClient } from "./organisms/availability/AvailabilityListClient";
export { AvailabilityEditorClient } from "./organisms/availability/AvailabilityEditorClient";

// Organisms - Settings
export { AppearanceClient } from "./organisms/settings/AppearanceClient";
export { BillingClient } from "./organisms/settings/BillingClient";
export { ProfileClient } from "./organisms/settings/profile/ProfileClient";
export { SettingsClient } from "./organisms/settings/SettingsClient";
export { OutOfOfficeClient } from "./organisms/settings/OutOfOfficeClient";
export { TeamSettingsClient } from "./organisms/settings/team/TeamSettingsClient";

// Molecules - Booking
export { BookingEventHeader } from "./molecules/booking/BookingEventHeader";
export { BookingCalendar } from "./molecules/booking/BookingCalendar";
export { TimeSlotsList } from "./molecules/booking/TimeSlotsList";
export { BookingDetailsForm } from "./molecules/booking/BookingDetailsForm";
export { BookingConfirmation } from "./molecules/booking/BookingConfirmation";
export { RescheduleBanner } from "./molecules/booking/RescheduleBanner";
export { StaffSelector, type StaffMember } from "./molecules/booking/StaffSelector";

// Organisms - Booking Flow
export {
  BookingFlow,
  EventNotFound,
} from "./organisms/booking-flow/BookingFlow";
export {
  UserProfileClient,
  UserNotFound,
} from "./organisms/booking-flow/UserProfileClient";
export {
  BookingDetailsClient,
  BookingNotFound,
} from "./organisms/booking-flow/BookingDetailsClient";

// Organisms - Landing
export { LandingHeader } from "./organisms/landing/LandingHeader";
export { HeroSection } from "./organisms/landing/HeroSection";
export { SocialProofBar } from "./organisms/landing/SocialProofBar";
export { FeaturesSection } from "./organisms/landing/FeaturesSection";
export { ProcessSection } from "./organisms/landing/ProcessSection";
export { PricingSection } from "./organisms/landing/PricingSection";
export { CtaBanner } from "./organisms/landing/CtaBanner";
export { LandingFooter } from "./organisms/landing/LandingFooter";

// Organisms - Cookie Consent
export { CookieBanner } from "./organisms/cookie-consent/CookieBanner";
export { useCookieConsentStore } from "./organisms/cookie-consent/store";

// Organisms - FAQ
export { FAQAccordion } from "./organisms/faq/FAQAccordion";
export { FAQSection } from "./organisms/faq/FAQSection";
export {
  type FAQItem,
  type FAQCategory,
  generalFAQs,
  salonOwnerFAQs,
  clientFAQs,
  faqCategories,
  homepageFAQs,
} from "./organisms/faq/faq-data";

// Hooks
export { useCookieConsent } from "./hooks/useCookieConsent";
export { useDebounce } from "./hooks/useDebounce";
export { useExponentialBackoffPolling } from "./hooks/useExponentialBackoffPolling";
