"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateTask } from "@/entities/task/api";
import { toDecimalString } from "@/shared/lib/format";

export async function updateTaskAction(formData: FormData) {
  const id = Number(formData.get("id"));
  const command = String(formData.get("command"));

  if (!id || !command) return;

  const payload =
    command === "done" && formData.get("actual_quantity_delta")
      ? { status: "done" as const, actual_quantity_delta: toDecimalString(formData.get("actual_quantity_delta")) }
      : command === "rejected"
        ? {
            status: "rejected" as const,
            defect_quantity_delta: toDecimalString(formData.get("defect_quantity_delta")),
            comment: String(formData.get("comment") ?? ""),
          }
        : { status: command as "in_progress" | "blocked" | "done" };

  await updateTask(id, payload);
  revalidatePath("/tasks");
  redirect("/tasks");
}
