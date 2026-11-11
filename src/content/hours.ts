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

/** Horaires transmis par le client — à reconfirmer avant publication. */
export const OPENING_HOURS: readonly DayHours[] = [
  { day: "Lundi", isClosed: false, opensAt: "15h30", closesAt: "00h30" },
  { day: "Mardi", isClosed: false, opensAt: "16h00", closesAt: "00h30" },
  { day: "Mercredi", isClosed: false, opensAt: "16h00", closesAt: "00h30" },
  { day: "Jeudi", isClosed: false, opensAt: "15h30", closesAt: "01h00" },
  { day: "Vendredi", isClosed: false, opensAt: "15h30", closesAt: "01h30" },
  { day: "Samedi", isClosed: false, opensAt: "15h30", closesAt: "01h30" },
  { day: "Dimanche", isClosed: true },
];

export const HOURS_NOTE = "Les fermetures après minuit comptent pour la nuit du jour indiqué.";
