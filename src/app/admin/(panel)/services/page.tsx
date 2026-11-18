import { deleteServiceAction, moveServiceAction } from "@/app/admin/_actions/services";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { CreateServiceForm, EditServiceForm } from "@/components/admin/ServicesForms";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { SERVICE_ICONS } from "@/content/services";
import { requireAdmin } from "@/lib/admin/auth";
import { fetchAllServicesForAdmin } from "@/lib/siteQueries";

export default async function AdminServicesPage() {
  const { supabase } = await requireAdmin();
  const services = await fetchAllServicesForAdmin(supabase);

  return (
    <div className="adm-narrow">
      <h1 className="adm-h1">Services</h1>
      <p className="adm-hint">
        Ces services s&rsquo;affichent sur le site sous forme de cartes, dans l&rsquo;ordre ci-dessous. Un service « masqué » reste enregistré ici mais n&rsquo;apparaît pas sur le site ;
        tant qu&rsquo;aucun service n&rsquo;est visible, la section n&rsquo;apparaît pas. Icônes disponibles : {SERVICE_ICONS.map((icon) => icon.label).join(", ")}.
      </p>
      <CreateServiceForm />
      {services.length === 0 ? (
        <p className="adm-empty">Aucun service pour l&rsquo;instant.</p>
      ) : (
        <ul className="adm-list">
          {services.map((service, index) => (
            <li key={service.id} className={`adm-row adm-row--service${service.visible ? "" : " adm-row--service-off"}`}>
              <div className="adm-row__main">
                {service.visible ? null : (
                  <p className="adm-row__status"><span className="adm-badge adm-badge--off">Masqué sur le site</span></p>
                )}
                <EditServiceForm service={service} />
              </div>
              <div className="adm-row__actions">
                <form action={moveServiceAction}>
                  <input type="hidden" name="id" value={service.id} />
                  <input type="hidden" name="direction" value="up" />
                  <SubmitButton variant="ghost" pendingLabel="…">↑ Monter</SubmitButton>
                </form>
                <form action={moveServiceAction}>
                  <input type="hidden" name="id" value={service.id} />
                  <input type="hidden" name="direction" value="down" />
                  <SubmitButton variant="ghost" pendingLabel="…">↓ Descendre</SubmitButton>
                </form>
                <form action={deleteServiceAction}>
                  <input type="hidden" name="id" value={service.id} />
                  <ConfirmSubmitButton message={`Supprimer le service « ${service.title} » ?`}>Supprimer</ConfirmSubmitButton>
                </form>
              </div>
              <span className="adm-sr">Position {index + 1} sur {services.length}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
