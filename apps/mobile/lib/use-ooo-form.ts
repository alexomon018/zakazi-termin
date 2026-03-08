import { useCallback, useState } from "react";
import { LayoutAnimation, Platform, UIManager } from "react-native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type OOOFormData = {
  uuid?: string;
  startDate: Date;
  endDate: Date;
  reasonId?: string;
  notes: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const createInitialForm = (): OOOFormData => ({
  startDate: new Date(),
  endDate: new Date(Date.now() + MS_PER_DAY),
  notes: "",
});

export function useOOOForm() {
  const [formData, setFormData] = useState<OOOFormData>(createInitialForm);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const animateLayout = useCallback(() => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "easeInEaseOut" },
      delete: { type: "easeInEaseOut", property: "opacity" },
    });
  }, []);

  const togglePicker = useCallback(
    (target: "start" | "end") => {
      animateLayout(); // single call — no double-animation
      if (target === "start") {
        setShowStartPicker((v) => !v);
        setShowEndPicker(false);
      } else {
        setShowEndPicker((v) => !v);
        setShowStartPicker(false);
      }
    },
    [animateLayout]
  );

  const toggleStartPicker = useCallback(() => togglePicker("start"), [togglePicker]);
  const toggleEndPicker = useCallback(() => togglePicker("end"), [togglePicker]);

  const dismissStartPicker = useCallback(() => {
    animateLayout();
    setShowStartPicker(false);
  }, [animateLayout]);

  const dismissEndPicker = useCallback(() => {
    animateLayout();
    setShowEndPicker(false);
  }, [animateLayout]);

  const closeForm = useCallback(() => {
    setShowStartPicker(false);
    setShowEndPicker(false);
  }, []);

  const resetForm = useCallback(() => {
    setFormData(createInitialForm());
  }, []);

  const editForm = useCallback(
    (item: {
      uuid: string;
      start: string | Date;
      end: string | Date;
      reasonId?: string | null;
      notes?: string | null;
    }) => {
      setFormData({
        uuid: item.uuid,
        startDate: new Date(item.start),
        endDate: new Date(item.end),
        reasonId: item.reasonId ?? undefined,
        notes: item.notes ?? "",
      });
    },
    []
  );

  return {
    formData,
    setFormData,
    showStartPicker,
    showEndPicker,
    toggleStartPicker,
    toggleEndPicker,
    dismissStartPicker,
    dismissEndPicker,
    closeForm,
    resetForm,
    editForm,
  };
}
