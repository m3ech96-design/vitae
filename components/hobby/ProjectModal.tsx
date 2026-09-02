"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useHobby } from "@/lib/hobby-context";
import { Project, ProjectStatus, ProjectDestination, ProjectMaterial } from "@/lib/hobby-types";
import { newId } from "@/lib/id";
import { TextField, TextArea } from "../ui/TextField";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { MultiPhotoPicker } from "./MultiPhotoPicker";
import { StarRating } from "./StarRating";

const STATUS_OPTIONS: { id: ProjectStatus; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "in-corso", label: "In corso" },
  { id: "in-pausa", label: "In pausa" },
  { id: "finito", label: "Finito" },
  { id: "abbandonato", label: "Abbandonato" },
];
const DESTINATION_OPTIONS: { id: ProjectDestination; label: string }[] = [
  { id: "per-te", label: "Per te" },
  { id: "regalo", label: "Regalo" },
  { id: "in-vendita", label: "In vendita" },
];

export function ProjectModal({
  hobbyId,
  blockId,
  project,
  onClose,
}: {
  hobbyId: string;
  blockId: string;
  project?: Project;
  onClose: () => void;
}) {
  const { addProject, updateProject, removeProject } = useHobby();

  const [name, setName] = useState(project?.name ?? "");
  const [photoKeys, setPhotoKeys] = useState<string[]>(project?.photoKeys ?? []);
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? "idea");
  const [startedDate, setStartedDate] = useState(project?.startedDate ?? "");
  const [finishedDate, setFinishedDate] = useState(project?.finishedDate ?? "");
  const [timeSpentMinutes, setTimeSpentMinutes] = useState(project?.timeSpentMinutes ? String(project.timeSpentMinutes) : "");
  const [materials, setMaterials] = useState<ProjectMaterial[]>(project?.materials ?? []);
  const [materialName, setMaterialName] = useState("");
  const [materialCost, setMaterialCost] = useState("");
  const [difficulty, setDifficulty] = useState<number | undefined>(project?.difficulty);
  const [inspirationUrl, setInspirationUrl] = useState(project?.inspirationUrl ?? "");
  const [destination, setDestination] = useState<ProjectDestination | undefined>(project?.destination);
  const [rating, setRating] = useState<number | undefined>(project?.rating);
  const [note, setNote] = useState(project?.note ?? "");

  const canSave = name.trim().length > 0;
  const totalCost = materials.reduce((s, m) => s + m.cost, 0);

  const addMaterial = () => {
    if (!materialName.trim()) return;
    setMaterials((prev) => [...prev, { id: newId(), name: materialName.trim(), cost: parseFloat(materialCost.replace(",", ".")) || 0 }]);
    setMaterialName("");
    setMaterialCost("");
  };

  const submit = () => {
    if (!canSave) return;
    const payload = {
      name: name.trim(),
      photoKeys,
      status,
      startedDate: startedDate || undefined,
      finishedDate: finishedDate || undefined,
      timeSpentMinutes: timeSpentMinutes ? Math.max(0, parseInt(timeSpentMinutes, 10)) : undefined,
      materials,
      difficulty,
      inspirationUrl: inspirationUrl.trim() || undefined,
      destination,
      rating,
      note: note.trim() || undefined,
    };
    if (project) updateProject(hobbyId, blockId, project.id, payload);
    else addProject(hobbyId, blockId, payload);
    onClose();
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-void-950/85 backdrop-blur-md sm:items-center">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: "spring", stiffness: 220, damping: 26 }}
        className="glass-strong flex max-h-[92dvh] w-full max-w-sm flex-col overflow-hidden rounded-t-xl3 sm:rounded-xl3"
      >
        <div className="shrink-0 flex items-center justify-between px-6 pt-6">
          <p className="font-display text-lg text-ink-100">{project ? "Modifica progetto" : "Nuovo progetto"}</p>
          <button onClick={onClose} className="focus-ring text-ink-600 hover:text-ink-200" aria-label="Chiudi">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <MultiPhotoPicker label="Foto (prima/durante/dopo)" photoKeys={photoKeys} onChange={setPhotoKeys} />

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Stato</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((o) => (
                <Chip key={o.id} label={o.label} selected={status === o.id} onClick={() => setStatus(o.id)} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Iniziato il" type="date" value={startedDate} onChange={(e) => setStartedDate(e.target.value)} />
            <TextField label="Finito il" type="date" value={finishedDate} onChange={(e) => setFinishedDate(e.target.value)} />
          </div>

          <TextField label="Tempo impiegato (minuti)" type="number" value={timeSpentMinutes} onChange={(e) => setTimeSpentMinutes(e.target.value)} />

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">
              Materiali {totalCost > 0 && <span className="text-ink-800">· {totalCost.toLocaleString("it-IT")}€ totale</span>}
            </p>
            {materials.length > 0 && (
              <div className="mb-2 space-y-1.5">
                {materials.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-xl2 border border-white/10 bg-white/[0.02] px-3 py-2 text-sm">
                    <span className="text-ink-100">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-600">{m.cost}€</span>
                      <button onClick={() => setMaterials((prev) => prev.filter((x) => x.id !== m.id))} className="focus-ring text-ink-800 hover:text-aura-pink" aria-label="Rimuovi materiale">
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={materialName}
                onChange={(e) => setMaterialName(e.target.value)}
                placeholder="Materiale"
                className="focus-ring flex-1 rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 placeholder:text-ink-800"
              />
              <input
                value={materialCost}
                onChange={(e) => setMaterialCost(e.target.value)}
                placeholder="€"
                inputMode="decimal"
                className="focus-ring w-16 rounded-xl2 border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 placeholder:text-ink-800"
              />
              <button onClick={addMaterial} className="focus-ring rounded-xl2 border border-white/10 px-3 text-ink-300 hover:border-aura-violet/50" aria-label="Aggiungi materiale">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <StarRating label="Difficoltà" value={difficulty} onChange={setDifficulty} />

          <TextField label="Fonte/ispirazione (link)" value={inspirationUrl} onChange={(e) => setInspirationUrl(e.target.value)} placeholder="https://..." />

          <div>
            <p className="mb-2 font-display text-xs uppercase tracking-[0.14em] text-ink-600">Destinazione</p>
            <div className="flex gap-2">
              {DESTINATION_OPTIONS.map((o) => (
                <Chip key={o.id} label={o.label} selected={destination === o.id} onClick={() => setDestination(destination === o.id ? undefined : o.id)} />
              ))}
            </div>
          </div>

          <StarRating label="Voto sul risultato" value={rating} onChange={setRating} />

          <TextArea label="Note/riflessioni" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4">
          <div className="flex gap-2">
            {project && (
              <Button variant="danger" onClick={() => { removeProject(hobbyId, blockId, project.id); onClose(); }} aria-label="Elimina">
                <Trash2 size={16} />
              </Button>
            )}
            <Button className="flex-1 justify-center" onClick={submit} disabled={!canSave}>
              {project ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
