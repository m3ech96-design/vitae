"use client";
import { ArrowLeft } from "lucide-react";
import { Reveal } from "../ui/Reveal";
import { Button } from "../ui/Button";

/**
 * Un passo qualunque del wizard delle scoperte dopo l'Identità essenziale — stessa sezione
 * già usata in "Il tuo profilo" (IdentityCoreFields, EducationWorkSection, CorpoSection,
 * InterestsSection), qui mostrata una alla volta invece che tutte insieme in una pagina
 * lunga. Niente qui è obbligatorio: "Avanti" funziona sempre, compilare o no è indifferente
 * — si può sempre tornare su "Il tuo profilo" più tardi, che resta la stessa identica
 * schermata, sempre consultabile e modificabile.
 */
export function DiscoveryStep({
  title,
  description,
  onBack,
  onNext,
  nextLabel = "Avanti",
  children,
}: {
  title: string;
  description?: string;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Reveal>
        <button onClick={onBack} className="focus-ring flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-200">
          <ArrowLeft size={15} /> Indietro
        </button>
        <h1 className="mt-4 font-display text-2xl text-ink-100">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-ink-600">{description}</p>}
      </Reveal>

      <Reveal delay={0.1} className="mt-7">
        {children}
      </Reveal>

      <Reveal delay={0.2}>
        <Button className="mt-9 w-full justify-center" onClick={onNext}>
          {nextLabel}
        </Button>
      </Reveal>
    </div>
  );
}
