"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Text } from "@radix-ui/themes";
import { ChevronDown } from "lucide-react";

import type { AdminWorkstationDto } from "@/entities/user/types";
import { labels } from "@/shared/i18n/labels";

type WorkstationMultiSelectProps = {
  formId: string;
  selectedIds: number[];
  workstations: AdminWorkstationDto[];
  username: string;
};

export function WorkstationMultiSelect({
  formId,
  selectedIds,
  workstations,
  username,
}: WorkstationMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number[]>(selectedIds);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelected(selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const selectedNames = workstations
    .filter((workstation) => selected.includes(workstation.id))
    .map((workstation) => workstation.name);
  const summary = selectedNames.length > 0 ? selectedNames.join(", ") : labels.app.unknown;

  function toggleWorkstation(id: number, checked: boolean) {
    setSelected((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }

      return current.filter((selectedId) => selectedId !== id);
    });
  }

  return (
    <div className="multi-dropdown" ref={rootRef}>
      <input form={formId} type="hidden" name="workstations_loaded" value="1" />
      {selected.map((id) => (
        <input key={id} form={formId} type="hidden" name="workstation_ids" value={id} />
      ))}

      <Button
        type="button"
        variant="soft"
        color="gray"
        className="multi-dropdown-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Рабочие станции пользователя ${username}`}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span className="multi-dropdown-summary" title={summary}>
          {summary}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </Button>

      {open ? (
        <div className="multi-dropdown-menu" role="listbox" aria-multiselectable="true">
          {workstations.length > 0 ? (
            workstations.map((workstation) => {
              const checked = selected.includes(workstation.id);

              return (
                <label key={workstation.id} className="multi-dropdown-option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => toggleWorkstation(workstation.id, event.currentTarget.checked)}
                  />
                  <Text size="2">{workstation.name}</Text>
                </label>
              );
            })
          ) : (
            <Text as="p" size="2" color="gray" className="multi-dropdown-empty">
              {labels.app.empty}
            </Text>
          )}
        </div>
      ) : null}
    </div>
  );
}
