import { HeroPhotoForm, HoursForm, SettingsForm } from "@/components/admin/SiteForms";
import { requireAdmin } from "@/lib/admin/auth";
import { mapHoursRows, mapSettingRows, type HoursRow, type SettingRow } from "@/lib/siteData";

export default async function AdminSitePage() {
  const { supabase } = await requireAdmin();
  const [settingsResult, hoursResult] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase.from("opening_hours").select("day_index, is_closed, opens_at, closes_at"),
  ]);
  if (settingsResult.error) throw new Error(`Lecture des réglages impossible : ${settingsResult.error.message}`);
  if (hoursResult.error) throw new Error(`Lecture des horaires impossible : ${hoursResult.error.message}`);

  const settings = mapSettingRows((settingsResult.data ?? []) as SettingRow[]);
  const hours = mapHoursRows((hoursResult.data ?? []) as HoursRow[]);
  const heroUrl = settings.heroPhoto ? supabase.storage.from("photos").getPublicUrl(settings.heroPhoto.path).data.publicUrl : null;

  return (
    <>
      <h1 className="adm-h1">Site</h1>
      <HeroPhotoForm currentUrl={heroUrl} />
      <SettingsForm tag={settings.tag} lead={settings.lead} phone={settings.phoneNumber ?? ""} />
      <HoursForm hours={hours.map((day) => (day.isClosed ? { isClosed: true, opensAt: "", closesAt: "" } : { isClosed: false, opensAt: day.opensAt, closesAt: day.closesAt }))} />
    </>
  );
}
