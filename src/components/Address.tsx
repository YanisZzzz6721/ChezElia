import { SITE } from "@/content/site";
import { PinIcon } from "./Icons";

export function Address() {
  return (
    <p className="b-addr">
      <PinIcon />
      {SITE.address}
    </p>
  );
}
