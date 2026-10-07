"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";
import { PhotoFrame } from "@/components/ui/PhotoFrame";
import { useToast } from "@/components/ui/Toast";
import { CheckIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { createPoll } from "@/lib/polls/actions";
import { uploadPollImage } from "@/lib/upload/client-upload";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  POLL_CATEGORIES,
  VISIBILITY_OPTIONS,
  type PollVisibility,
} from "@/types/poll";

type Slot = {
  key: string;
  label: string;
  imageUrl: string;
  preview: string;
  status: "empty" | "uploading" | "ready";
};

const PROMPTS = [
  "Which photo should I post?",
  "Which one for my profile pic?",
  "Which outfit for Saturday?",
  "Which logo feels right?",
  "Which paint colour wins?",
  "Which one would you order?",
];

function emptySlot(): Slot {
  return {
    key: crypto.randomUUID(),
    label: "",
    imageUrl: "",
    preview: "",
    status: "empty",
  };
}

export function CreatePollForm() {
  const router = useRouter();
  const { notify } = useToast();
  const [isSubmitting, startSubmit] = useTransition();

  const [question, setQuestion] = useState("");
  const [category, setCategory] = useState<string>("Social");
  const [visibility, setVisibility] = useState<PollVisibility>("public");
  const [slots, setSlots] = useState<Slot[]>([emptySlot(), emptySlot()]);
  const [error, setError] = useState<string | null>(null);
  const [placeholder] = useState(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
  );

  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const patchSlot = useCallback((key: string, patch: Partial<Slot>) => {
    setSlots((prev) =>
      prev.map((slot) => (slot.key === key ? { ...slot, ...patch } : slot)),
    );
  }, []);

  const handleFile = async (key: string, file: File) => {
    setError(null);
    const preview = URL.createObjectURL(file);
    patchSlot(key, { status: "uploading", preview, imageUrl: "" });

    const result = await uploadPollImage(file);
    URL.revokeObjectURL(preview);

    if ("error" in result) {
      patchSlot(key, { status: "empty", preview: "", imageUrl: "" });
      setError(result.error);
      notify(result.error, "error");
      return;
    }

    patchSlot(key, {
      status: "ready",
      imageUrl: result.url,
      preview: result.url,
    });
  };

  const clearSlot = (key: string) => {
    patchSlot(key, { status: "empty", imageUrl: "", preview: "", label: "" });
    const input = inputs.current[key];
    if (input) input.value = "";
  };

  const addSlot = () => {
    if (slots.length >= MAX_OPTIONS) return;
    setSlots((prev) => [...prev, emptySlot()]);
  };

  const removeSlot = (key: string) => {
    if (slots.length <= MIN_OPTIONS) return;
    setSlots((prev) => prev.filter((slot) => slot.key !== key));
  };

  const readySlots = slots.filter((slot) => slot.status === "ready");
  const uploading = slots.some((slot) => slot.status === "uploading");
  const canSubmit =
    question.trim().length >= 3 &&
    readySlots.length >= MIN_OPTIONS &&
    !uploading &&
    !isSubmitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setError(null);

    startSubmit(async () => {
      const result = await createPoll({
        question,
        category,
        visibility,
        options: readySlots.map((slot) => ({
          label: slot.label,
          imageUrl: slot.imageUrl,
        })),
      });

      if (!result.ok || !result.pollId) {
        setError(result.error ?? "Something went wrong.");
        notify(result.error ?? "Something went wrong.", "error");
        return;
      }

      notify("Poll is live", "success");
      router.push(`/p/${result.pollId}?created=1`);
    });
  };

  return (
    <div className="space-y-5">
      <section className="panel-flat p-5">
        <div className="mb-2.5 flex items-baseline justify-between">
          <label
            htmlFor="question"
            className="text-xs font-bold uppercase tracking-[0.14em] text-white/40"
          >
            Your question
          </label>
          <span className="text-[11px] tabular-nums text-white/25">
            {question.length}/200
          </span>
        </div>
        <textarea
          id="question"
          value={question}
          onChange={(event) => setQuestion(event.target.value.slice(0, 200))}
          placeholder={placeholder}
          rows={2}
          className="field resize-none text-lg font-semibold leading-snug"
        />
        <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
          {POLL_CATEGORIES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              className={`category-pill shrink-0 px-2.5 py-1.5 ${
                category === option
                  ? "category-pill-active"
                  : "text-paper-muted hover:text-paper"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-flat p-5">
        <div className="mb-3.5 flex items-baseline justify-between">
          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-white/40">
            Photos
          </h2>
          <span className="text-[11px] font-medium text-white/35">
            {readySlots.length}/{slots.length} ready · min {MIN_OPTIONS}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {slots.map((slot, index) => (
            <div key={slot.key} className="space-y-2">
              <div className="tile aspect-[4/5]">
                {slot.preview ? (
                  <>
                    <PhotoFrame
                      src={slot.preview}
                      alt={slot.label || `Photo ${index + 1}`}
                      priority
                    />
                    {slot.status === "uploading" && (
                      <div className="absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                          <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                            Uploading
                          </span>
                        </div>
                      </div>
                    )}
                    {slot.status === "ready" && (
                      <>
                        <span className="anim-pop badge-letter badge-picked absolute left-2 top-2">
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                        <button
                          type="button"
                          onClick={() => clearSlot(slot.key)}
                          aria-label="Remove photo"
                          className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 backdrop-blur-md transition-colors hover:bg-red-500/80"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputs.current[slot.key]?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 border border-dashed border-line-strong transition-colors hover:border-brand/60 hover:bg-brand-soft"
                  >
                    <PlusIcon className="h-6 w-6 text-white/45" />
                    <span className="text-[11px] font-semibold text-white/45">
                      Photo {index + 1}
                    </span>
                  </button>
                )}

                <input
                  ref={(element) => {
                    inputs.current[slot.key] = element;
                  }}
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleFile(slot.key, file);
                  }}
                />
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  value={slot.label}
                  onChange={(event) =>
                    patchSlot(slot.key, {
                      label: event.target.value.slice(0, 40),
                    })
                  }
                  placeholder="Label (optional)"
                  className="field !rounded-xl !px-3 !py-2 text-xs"
                />
                {slots.length > MIN_OPTIONS && (
                  <button
                    type="button"
                    onClick={() => removeSlot(slot.key)}
                    aria-label={`Remove option ${index + 1}`}
                    className="btn-ghost grid h-8 w-8 shrink-0 place-items-center text-white/50"
                  >
                    <span className="text-lg leading-none">−</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {slots.length < MAX_OPTIONS && (
          <button
            type="button"
            onClick={addSlot}
            className="btn-ghost mt-3 flex w-full items-center justify-center gap-2 py-3 text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            Add another photo
          </button>
        )}
      </section>

      <section className="panel-flat p-5">
        <h2 className="mb-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white/40">
          Who can see it
        </h2>
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map((option) => (
            <ChoiceRow
              key={option.value}
              label={option.label}
              hint={option.hint}
              selected={visibility === option.value}
              onSelect={() => setVisibility(option.value)}
            />
          ))}
        </div>
      </section>

      {error && (
        <p className="anim-rise rounded-2xl bg-red-500/12 px-4 py-3 text-sm text-red-200 ring-1 ring-red-400/25">
          {error}
        </p>
      )}

      <div className="sticky bottom-[5.5rem] z-20 flex gap-2 border border-line bg-ink-soft p-1.5">
        <Link href="/feed" className="btn-ghost px-6 py-3.5 text-sm">
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="btn-brand flex flex-1 items-center justify-center gap-2 py-3.5 text-sm"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
              Publishing
            </>
          ) : uploading ? (
            "Waiting for photos…"
          ) : readySlots.length < MIN_OPTIONS ? (
            `Add ${MIN_OPTIONS - readySlots.length} more photo${MIN_OPTIONS - readySlots.length === 1 ? "" : "s"}`
          ) : (
            "Publish poll"
          )}
        </button>
      </div>
    </div>
  );
}

function ChoiceRow({
  label,
  hint,
  selected,
  onSelect,
}: {
  label: string;
  hint: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-start gap-3 border p-3.5 text-left transition-colors ${
        selected
          ? "border-brand bg-brand-soft"
          : "border-line bg-transparent hover:bg-surface"
      }`}
    >
      <span
        className={`mt-0.5 grid shrink-0 place-items-center border-2 ${
          selected ? "border-brand bg-brand" : "border-line-strong"
        }`}
        style={{ height: "1.125rem", width: "1.125rem" }}
      >
        {selected && <span className="h-1.5 w-1.5 bg-white" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-xs leading-snug text-paper-muted">
          {hint}
        </span>
      </span>
    </button>
  );
}
