"use client";

import { useState } from "react";
import type { WaitlistTarget } from "@codeorbit/schema";

export function WaitlistForm({
  target,
  heading,
  subheading,
}: {
  target: WaitlistTarget;
  heading: string;
  subheading: string;
}) {
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setState("submitting");
    setMessage(null);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          organization: formData.get("organization"),
          role: formData.get("role"),
          teamSize: formData.get("teamSize"),
          message: formData.get("message"),
          target,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to submit right now.");
      }

      setState("success");
      setMessage(payload?.message ?? "Request received.");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage((error as { message?: string })?.message ?? "Unable to submit right now.");
    }
  };

  return (
    <section className="surface-card p-5 sm:p-6">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">Waitlist</p>
      <h2 className="mt-3 text-2xl font-semibold">{heading}</h2>
      <p className="text-muted mt-2 text-sm leading-7">{subheading}</p>

      <form className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
        <div>
          <label htmlFor={`${target}-name`} className="mb-2 block text-sm font-medium text-soft">
            Name
          </label>
          <input id={`${target}-name`} name="name" className="field-input" required={true} />
        </div>
        <div>
          <label htmlFor={`${target}-email`} className="mb-2 block text-sm font-medium text-soft">
            Work email
          </label>
          <input id={`${target}-email`} name="email" type="email" className="field-input" required={true} />
        </div>
        <div>
          <label htmlFor={`${target}-organization`} className="mb-2 block text-sm font-medium text-soft">
            Organization
          </label>
          <input id={`${target}-organization`} name="organization" className="field-input" required={true} />
        </div>
        <div>
          <label htmlFor={`${target}-role`} className="mb-2 block text-sm font-medium text-soft">
            Role
          </label>
          <input id={`${target}-role`} name="role" className="field-input" required={true} />
        </div>
        <div>
          <label htmlFor={`${target}-team-size`} className="mb-2 block text-sm font-medium text-soft">
            Team size
          </label>
          <input id={`${target}-team-size`} name="teamSize" className="field-input" placeholder="Optional" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor={`${target}-message`} className="mb-2 block text-sm font-medium text-soft">
            What are you trying to improve?
          </label>
          <textarea
            id={`${target}-message`}
            name="message"
            className="field-textarea min-h-[130px]"
            placeholder="Share your hiring, placement, or interview-season goals."
          />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            className="btn-primary"
            disabled={state === "submitting"}
          >
            {state === "submitting" ? "Submitting..." : "Request access"}
          </button>
          {message ? (
            <p className={`text-sm ${state === "error" ? "text-rose-400" : "text-emerald-400"}`}>{message}</p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
