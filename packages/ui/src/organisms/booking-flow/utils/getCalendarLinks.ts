import { createEvent } from "ics";

export enum CalendarLinkType {
  GOOGLE_CALENDAR = "googleCalendar",
  MICROSOFT_OFFICE = "microsoftOffice",
  MICROSOFT_OUTLOOK = "microsoftOutlook",
  ICS = "ics",
}

interface CalendarLinkParams {
  startTime: Date;
  endTime: Date;
  title: string;
  description?: string | null;
  location?: string | null;
}

const buildICalLink = ({
  startTime,
  endTime,
  title,
  description,
  location,
}: CalendarLinkParams) => {
  const durationInMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  const iCalEvent = createEvent({
    start: [
      startTime.getUTCFullYear(),
      startTime.getUTCMonth() + 1,
      startTime.getUTCDate(),
      startTime.getUTCHours(),
      startTime.getUTCMinutes(),
    ],
    startInputType: "utc",
    title,
    duration: {
      minutes: durationInMinutes,
    },
    ...(description ? { description } : {}),
    ...(location ? { location } : {}),
  });

  if (iCalEvent.error) {
    throw iCalEvent.error;
  }

  return `data:text/calendar,${encodeURIComponent(iCalEvent.value || "")}`;
};

const formatDateTimeForGoogle = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
};

const formatDateTimeForMicrosoft = (date: Date): string => {
  return date.toISOString();
};

const buildGoogleCalendarLink = ({
  startTime,
  endTime,
  title,
  description,
  location,
}: CalendarLinkParams) => {
  const startTimeFormatted = formatDateTimeForGoogle(startTime);
  const endTimeFormatted = formatDateTimeForGoogle(endTime);
  const locationParam = location ? encodeURIComponent(location) : "";
  const descriptionParam = description ? encodeURIComponent(description) : "";

  return `https://calendar.google.com/calendar/r/eventedit?dates=${startTimeFormatted}/${endTimeFormatted}&text=${encodeURIComponent(
    title
  )}&details=${descriptionParam}${locationParam ? `&location=${locationParam}` : ""}`;
};

const buildMicrosoftOfficeLink = ({
  startTime,
  endTime,
  title,
  description,
  location,
}: CalendarLinkParams) => {
  const startTimeFormatted = formatDateTimeForMicrosoft(startTime);
  const endTimeFormatted = formatDateTimeForMicrosoft(endTime);
  const locationParam = location ? encodeURIComponent(location) : "";
  const descriptionParam = description ? encodeURIComponent(description) : "";

  return `https://outlook.office.com/calendar/0/deeplink/compose?body=${descriptionParam}&enddt=${endTimeFormatted}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=${startTimeFormatted}&subject=${encodeURIComponent(
    title
  )}${locationParam ? `&location=${locationParam}` : ""}`;
};

const buildMicrosoftOutlookLink = ({
  startTime,
  endTime,
  title,
  description,
  location,
}: CalendarLinkParams) => {
  const startTimeFormatted = formatDateTimeForMicrosoft(startTime);
  const endTimeFormatted = formatDateTimeForMicrosoft(endTime);
  const locationParam = location ? encodeURIComponent(location) : "";
  const descriptionParam = description ? encodeURIComponent(description) : "";

  return (
    encodeURI(
      `https://outlook.live.com/calendar/0/deeplink/compose?body=${descriptionParam}&enddt=${endTimeFormatted}&path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&startdt=${startTimeFormatted}&subject=${encodeURIComponent(
        title
      )}`
    ) + (locationParam ? `&location=${locationParam}` : "")
  );
};

export interface CalendarLink {
  label: string;
  id: CalendarLinkType;
  link: string;
}

export const getCalendarLinks = (params: CalendarLinkParams): CalendarLink[] => {
  const googleCalendarLink = buildGoogleCalendarLink(params);
  const microsoftOfficeLink = buildMicrosoftOfficeLink(params);
  const microsoftOutlookLink = buildMicrosoftOutlookLink(params);

  let icsFileLink = "";
  try {
    icsFileLink = buildICalLink(params);
  } catch (error) {
    console.error("Error generating ICS file", error);
  }

  return [
    {
      label: "Google Calendar",
      id: CalendarLinkType.GOOGLE_CALENDAR,
      link: googleCalendarLink,
    },
    {
      label: "Microsoft Office",
      id: CalendarLinkType.MICROSOFT_OFFICE,
      link: microsoftOfficeLink,
    },
    {
      label: "Microsoft Outlook",
      id: CalendarLinkType.MICROSOFT_OUTLOOK,
      link: microsoftOutlookLink,
    },
    {
      label: "Apple Calendar",
      id: CalendarLinkType.ICS,
      link: icsFileLink,
    },
  ];
};
