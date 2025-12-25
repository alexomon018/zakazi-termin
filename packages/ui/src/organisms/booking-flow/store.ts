import { create } from "zustand";

export type BookingState = "selecting_date" | "selecting_time" | "booking" | "confirmation";

interface BookingStore {
  // State
  state: BookingState;
  selectedDate: string | null;
  selectedSlot: string | null;
  tentativeSlot: string | null;
  currentMonth: Date;

  // Form data
  formData: {
    name: string;
    email: string;
    phoneNumber: string;
    notes: string;
  };

  // Actions
  setState: (state: BookingState) => void;
  setSelectedDate: (date: string | null) => void;
  setTentativeSlot: (slot: string | null) => void;
  confirmSlot: () => void;
  resetSelection: () => void;
  setCurrentMonth: (month: Date) => void;
  setFormData: (data: Partial<BookingStore["formData"]>) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  reset: () => void;
}

const initialFormData = {
  name: "",
  email: "",
  phoneNumber: "",
  notes: "",
};

export const useBookingStore = create<BookingStore>((set, get) => ({
  // Initial state
  state: "selecting_date",
  selectedDate: null,
  selectedSlot: null,
  tentativeSlot: null,
  currentMonth: new Date(),
  formData: initialFormData,

  // Actions
  setState: (state) => set({ state }),

  setSelectedDate: (date) => {
    set({
      selectedDate: date,
      state: date ? "selecting_time" : "selecting_date",
      selectedSlot: null,
      tentativeSlot: null,
    });
  },

  setTentativeSlot: (slot) => set({ tentativeSlot: slot }),

  confirmSlot: () => {
    const { tentativeSlot } = get();
    if (tentativeSlot) {
      set({
        selectedSlot: tentativeSlot,
        state: "booking",
      });
    }
  },

  resetSelection: () => {
    set({
      selectedDate: null,
      selectedSlot: null,
      tentativeSlot: null,
      state: "selecting_date",
    });
  },

  setCurrentMonth: (month) => set({ currentMonth: month }),

  setFormData: (data) => {
    set((state) => ({
      formData: { ...state.formData, ...data },
    }));
  },

  goToNextStep: () => {
    const { state } = get();
    if (state === "selecting_date") {
      set({ state: "selecting_time" });
    } else if (state === "selecting_time") {
      set({ state: "booking" });
    } else if (state === "booking") {
      set({ state: "confirmation" });
    }
  },

  goToPreviousStep: () => {
    const { state } = get();
    if (state === "booking") {
      set({ state: "selecting_time" });
    } else if (state === "selecting_time") {
      set({
        state: "selecting_date",
        selectedSlot: null,
        tentativeSlot: null,
      });
    }
  },

  reset: () => {
    set({
      state: "selecting_date",
      selectedDate: null,
      selectedSlot: null,
      tentativeSlot: null,
      currentMonth: new Date(),
      formData: initialFormData,
    });
  },
}));
