interface ClosedDay {
  day: string;
  isClosed: true;
}

interface OpenDay {
  day: string;
  isClosed: false;
  /** Format « 15h30 ». */
  opensAt: string;
  /** Format « 00h30 » ; peut tomber après minuit. */
  closesAt: string;
}

export type DayHours = OpenDay | ClosedDay;

export const HOURS_NOTE = "Les fermetures après minuit comptent pour la nuit du jour indiqué.";
