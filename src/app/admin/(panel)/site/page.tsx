import { HeroPhotoForm, HoursForm, SettingsForm, SocialLinksForm } from "@/components/admin/SiteForms";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchSocialUrlsForAdmin } from "@/lib/siteQueries";
import { mapHoursRows, mapSettingRows, type HoursRow, type SettingRow } from "@/lib/siteData";

export default async function AdminSitePage() {
  const { supabase } = await requireAdmin();
  const [settingsResult, hoursResult, socialUrls] = await Promise.all([
    supabase.from("site_settings").select("key, value"),
    supabase.from("opening_hours").select("day_index, is_closed, opens_at, closes_at"),
    fetchSocialUrlsForAdmin(supabase),
  ]);
  if (settingsResult.error) throw new Error(`Lecture des réglages impossible : ${settingsResult.error.message}`);
  if (hoursResult.error) throw new Error(`Lecture des horaires impossible : ${hoursResult.error.message}`);

  const settings = mapSettingRows((settingsResult.data ?? []) as SettingRow[]);
  const hours = mapHoursRows((hoursResult.data ?? []) as HoursRow[]);
  const heroUrl = settings.heroPhoto ? supabase.storage.from("photos").getPublicUrl(settings.heroPhoto.path).data.publicUrl : null;

  return (
    <>
      <h1 className="adm-h1">Site</h1>
      <div className="adm-cols">
        <div className="adm-cols__main">
          <HeroPhotoForm currentUrl={heroUrl} />
          <SettingsForm tag={settings.tag} lead={settings.lead} phone={settings.phoneNumber ?? ""} />
          <SocialLinksForm urls={socialUrls} />
        </div>
        <div className="adm-cols__side">
      <HoursForm hours={hours.map((day) => (day.isClosed ? { isClosed: true, opensAt: "", closesAt: "" } : { isClosed: false, opensAt: day.opensAt, closesAt: day.closesAt }))} />
        </div>
      </div>
    </>
  );
}
