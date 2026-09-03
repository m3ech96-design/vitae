"use client";
import { useState } from "react";
import { Plus, X, Phone, MapPin } from "lucide-react";
import { useMedical } from "@/lib/medical-context";
import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";

export function ContactsSection() {
  const { contacts, addContact, removeContact } = useMedical();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const submit = () => {
    if (!name.trim() || !role.trim()) return;
    addContact({ name: name.trim(), role: role.trim(), phone: phone.trim() || undefined, address: address.trim() || undefined });
    setName("");
    setRole("");
    setPhone("");
    setAddress("");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {contacts.map((c) => (
        <div key={c.id} className="flex items-start justify-between rounded-xl2 border border-white/[0.06] bg-white/[0.02] px-3.5 py-2.5">
          <div className="min-w-0">
            <p className="text-sm text-ink-100">{c.name}</p>
            <p className="text-[11px] text-ink-800">{c.role}</p>
            {c.phone && (
              <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="mt-1 flex items-center gap-1 text-[11px] text-aura-cyan">
                <Phone size={11} /> {c.phone}
              </a>
            )}
            {c.address && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-800">
                <MapPin size={11} /> {c.address}
              </p>
            )}
          </div>
          <button onClick={() => removeContact(c.id)} className="focus-ring shrink-0 text-ink-800 hover:text-aura-pink" aria-label="Rimuovi">
            <X size={14} />
          </button>
        </div>
      ))}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl2 border border-dashed border-white/15 py-2.5 text-xs text-ink-600 hover:border-aura-violet/50 hover:text-ink-200"
        >
          <Plus size={14} /> Aggiungi contatto
        </button>
      ) : (
        <div className="space-y-2.5 rounded-xl2 border border-aura-violet/30 bg-white/[0.03] p-3">
          <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Dott.ssa Rossi" autoFocus />
          <TextField label="Ruolo" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Es. Medico di base, cardiologo, farmacia" />
          <TextField label="Telefono (facoltativo)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField label="Indirizzo (facoltativo)" value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button size="sm" onClick={submit} disabled={!name.trim() || !role.trim()}>
              Salva
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
