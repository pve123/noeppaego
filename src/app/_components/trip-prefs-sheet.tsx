"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import type { TripPrefs } from "@/contexts/itinerary";
import {
  AVOIDS,
  COMPANIONS,
  DEFAULT_DESSERT,
  DESSERTS,
  INTERESTS,
  PACES,
  parsePrefs,
  prefsEntries,
  prefsSummary,
  type Option,
} from "./trip-prefs";

type PrefsDay = { date: string; dayNumber: number; dateLabel: string; hasDinner: boolean; toneClass: string };

/**
 * 여행 취향 카드 + 시트 — 카드는 고른 취향을 칩으로 보여 주고, 누르면 시트가 열린다(휴대폰은 아래에서, 넓은 화면은 가운데).
 * 고르고 「이대로 다시 짜기」를 누르면 주소(?with=…)를 바꿔 서버가 일정을 다시 짠다 — 저장·공유도 그 주소 그대로.
 * 취향을 바꾸면 직접 바꾼 칸(pick)은 처음으로 돌아간다(고른 곳이 새 일정과 안 맞을 수 있어서).
 */
export function TripPrefsSheet({
  base,
  prefs,
  days,
  hasPicks,
}: {
  base: string;
  prefs: TripPrefs;
  days: PrefsDay[];
  hasPicks: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [count, setCount] = useState(() => prefsEntries(prefs).length);
  const summary = prefsSummary(prefs, days);
  const chosen = summary.length > 0;

  const read = (): TripPrefs => {
    const data = new FormData(form.current!);
    const one = (name: string) => String(data.get(name) ?? "") || undefined;
    return parsePrefs({
      with: one("with"),
      pace: one("pace"),
      like: data.getAll("like").map(String),
      avoid: days.flatMap((d) => data.getAll(`avoid-${d.date}`).map((v) => `${d.date}~${v}`)),
      dessert: days.flatMap((d) => (one(`dessert-${d.date}`) ? [`${d.date}~${one(`dessert-${d.date}`)}`] : [])),
    });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams(prefsEntries(read()));
    dialog.current?.close();
    startTransition(() => router.push(query.size > 0 ? `${base}?${query}` : base, { scroll: false }));
  };

  return (
    <>
      <section
        aria-labelledby="prefs-title"
        className="relative overflow-hidden rounded-3xl border-[3px] border-ink bg-lavender p-5 shadow-pop sm:p-6"
      >
        <span aria-hidden className="pointer-events-none absolute -right-3 -top-4 rotate-12 select-none text-[64px] opacity-90 sm:text-[80px]">
          {chosen ? "🎒" : "✨"}
        </span>
        <h2 id="prefs-title" className="pr-14 font-display text-[24px] leading-tight">
          {chosen ? "취향에 맞춰 짠 일정이에요" : "어떤 여행이 좋아요?"}
        </h2>
        <p className="mt-1 pr-14 text-[15px] text-ink/80">
          {chosen ? "바꾸고 싶으면 언제든 다시 골라요." : "누구와, 어떤 속도로, 뭘 먹고 싶은지 고르면 일정을 다시 짜 드려요."}
        </p>

        <ul aria-label={chosen ? "고른 취향" : "고를 수 있는 것 예시"} className="mt-4 flex flex-wrap gap-1.5">
          {(chosen ? summary : ["🧒 누구와", "🐢 속도", "🌿 좋아하는 것", "🚫 못 먹는 음식", "🍰 디저트"]).map((s) => (
            <li
              key={s}
              className={`rounded-full border-2 px-3 py-1 text-[13px] font-bold ${
                chosen ? "border-ink bg-surface" : "border-dashed border-ink/40 bg-surface/60 text-ink/70"
              }`}
            >
              {s}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => dialog.current?.showModal()}
            disabled={pending}
            aria-haspopup="dialog"
            className="inline-flex h-12 items-center gap-2 rounded-[16px] border-[3px] border-ink bg-yellow px-5 font-display text-[17px] shadow-pop-sm transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
          >
            {pending ? (
              <>
                <span aria-hidden className="size-4 animate-spin rounded-full border-[3px] border-ink border-t-transparent" />
                다시 짜는 중…
              </>
            ) : chosen ? (
              "취향 바꾸기"
            ) : (
              "취향 고르기"
            )}
          </button>
          {chosen && !pending && (
            <Link href={base} scroll={false} className="text-[15px] font-bold underline underline-offset-4">
              취향 지우기
            </Link>
          )}
        </div>
      </section>

      <dialog
        ref={dialog}
        aria-labelledby="prefs-sheet-title"
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        // overflow-clip — 시트 자체는 스크롤되지 않는다(hidden 은 초점이 갈 때 브라우저가 밀어 올릴 수 있다). 스크롤은 안쪽 본문만.
        className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-clip rounded-t-3xl border-[3px] border-b-0 border-ink bg-cream p-0 text-ink shadow-pop backdrop:bg-ink/50 sm:inset-0 sm:m-auto sm:max-h-[85dvh] sm:max-w-xl sm:rounded-3xl sm:border-b-[3px]"
      >
        <form ref={form} onSubmit={submit} onChange={() => setCount(prefsEntries(read()).length)} className="flex max-h-[inherit] flex-col">
          <header className="shrink-0 px-5 pt-3">
            <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink/20 sm:hidden" />
            <div className="flex items-center justify-between gap-3">
              <h2 id="prefs-sheet-title" className="font-display text-[22px]">
                여행 취향 고르기
              </h2>
              <button
                type="button"
                onClick={() => dialog.current?.close()}
                className="flex size-11 shrink-0 items-center justify-center rounded-full text-2xl text-ink/60 hover:bg-ink/5 hover:text-ink"
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-muted">고른 것만 반영해요. 건너뛰어도 괜찮아요.</p>
          </header>

          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 pb-6 pt-5">
            <Group title="누구와 가요?">
              <Chip type="radio" name="with" value="" defaultChecked={!prefs.companion}>
                상관없음
              </Chip>
              {COMPANIONS.map((o) => (
                <OptionChip key={o.value} type="radio" name="with" option={o} defaultChecked={prefs.companion === o.value} />
              ))}
            </Group>

            <Group title="어떤 속도가 좋아요?" layout="grid">
              {PACES.map((o) => (
                <label
                  key={o.value}
                  className="relative flex cursor-pointer flex-col items-center gap-0.5 rounded-2xl border-[2.5px] border-ink bg-surface px-2 py-3 text-center transition-transform hover:-translate-y-0.5 has-[:checked]:-rotate-1 has-[:checked]:bg-mint has-[:checked]:shadow-pop-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2"
                >
                  <input type="radio" name="pace" value={o.value} defaultChecked={(prefs.pace ?? "normal") === o.value} className="sr-only" />
                  <span aria-hidden className="text-[28px] leading-none">
                    {o.emoji}
                  </span>
                  <span className="mt-1 font-display text-[16px]">{o.label}</span>
                  <span className="text-[12px] leading-tight text-ink/70">{o.hint}</span>
                </label>
              ))}
            </Group>

            <Group title="좋아하는 것" hint="여러 개 골라도 돼요">
              {INTERESTS.map((o) => (
                <OptionChip key={o.value} type="checkbox" name="like" option={o} defaultChecked={prefs.interests?.includes(o.value)} />
              ))}
            </Group>

            <section aria-labelledby="prefs-days" className="space-y-4">
              <h3 id="prefs-days" className="font-display text-[19px]">
                날마다 고르기
              </h3>
              {days.map((day) => {
                const p = prefs.days?.[day.date];
                return (
                  <div key={day.date} className="rounded-2xl border-[2.5px] border-ink bg-surface p-4">
                    <p className="flex items-baseline gap-2">
                      <span className={`-rotate-2 rounded-xl border-[2.5px] border-ink px-2.5 font-display text-[17px] ${day.toneClass}`}>
                        {day.dayNumber}일차
                      </span>
                      <span className="font-display text-[15px] text-muted">{day.dateLabel}</span>
                    </p>

                    <Group title="못 먹는 음식" small scroll hint="이날 식당에서 빼요">
                      {AVOIDS.map((o) => (
                        <OptionChip
                          key={o.value}
                          type="checkbox"
                          name={`avoid-${day.date}`}
                          option={o}
                          tone="coral"
                          defaultChecked={p?.avoid?.includes(o.value)}
                        />
                      ))}
                    </Group>

                    <Group title="디저트" small scroll hint={day.hasDinner ? undefined : "이날은 저녁 전에 출발해요"}>
                      {DESSERTS.map((o) => (
                        <OptionChip
                          key={o.value}
                          type="radio"
                          name={`dessert-${day.date}`}
                          option={o}
                          tone="peach"
                          disabled={o.needsDinner && !day.hasDinner}
                          defaultChecked={(p?.dessert ?? DEFAULT_DESSERT) === o.value}
                        />
                      ))}
                    </Group>
                  </div>
                );
              })}
            </section>
          </div>

          <footer className="shrink-0 border-t-[3px] border-ink bg-cream/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            {hasPicks && <p className="mb-2 text-[13px] text-muted">직접 바꾼 칸은 처음 일정으로 돌아가요.</p>}
            <div className="flex items-center gap-3">
              <span aria-live="polite" className="shrink-0 text-[14px] font-bold text-ink/70">
                {count > 0 ? `${count}개 골랐어요` : "아직 안 골랐어요"}
              </span>
              <button
                type="submit"
                className="ml-auto inline-flex h-13 min-w-0 flex-1 items-center justify-center gap-2 rounded-[18px] border-[3px] border-ink bg-coral px-5 font-display text-[18px] shadow-pop-sm transition-transform hover:-translate-y-0.5 sm:flex-none"
              >
                이대로 다시 짜기
              </button>
            </div>
          </footer>
        </form>
      </dialog>
    </>
  );
}

function Group({
  title,
  hint,
  children,
  layout = "wrap",
  small = false,
  scroll = false,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  layout?: "wrap" | "grid";
  small?: boolean;
  scroll?: boolean;
}) {
  return (
    // fieldset 은 기본 최소 너비가 내용 폭이라 옆으로 미는 칩 줄이 카드 밖으로 넘친다 — min-w-0
    <fieldset className={`min-w-0 ${small ? "mt-4" : ""}`}>
      <legend className="flex flex-wrap items-baseline gap-x-2">
        <span className={`font-display ${small ? "text-[16px]" : "text-[19px]"}`}>{title}</span>
        {hint && <span className="text-[13px] text-muted">{hint}</span>}
      </legend>
      <div
        className={`mt-2.5 ${
          layout === "grid"
            ? "grid grid-cols-3 gap-2"
            : scroll
              ? // 휴대폰은 옆으로 밀어 본다 — 칩이 줄을 넘겨 시트가 길어지지 않게
                "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
              : "flex flex-wrap gap-2"
        }`}
      >
        {children}
      </div>
    </fieldset>
  );
}

const CHECKED_TONE = { yellow: "has-[:checked]:bg-yellow", coral: "has-[:checked]:bg-coral", peach: "has-[:checked]:bg-peach" } as const;

/**
 * 고르는 칩 — 라디오·체크박스를 칩 모양으로. 고르면 색이 차고 살짝 기운다(자바스크립트 없이 :checked 로).
 * label 을 relative 로 둔다 — 숨긴 입력(sr-only, absolute)이 시트 기준으로 놓이면 누를 때 초점이 가며 시트가 통째로 밀려 올라간다.
 */
function Chip({
  type,
  name,
  value,
  defaultChecked,
  disabled,
  tone = "yellow",
  children,
}: {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  tone?: keyof typeof CHECKED_TONE;
  children: ReactNode;
}) {
  return (
    <label
      className={`relative inline-flex h-11 shrink-0 cursor-pointer select-none items-center gap-1.5 whitespace-nowrap rounded-full border-[2.5px] border-ink bg-surface px-4 font-display text-[16px] transition-transform hover:-translate-y-0.5 has-[:checked]:-rotate-1 has-[:checked]:shadow-pop-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:border-ink/25 has-[:disabled]:text-ink/35 has-[:disabled]:hover:translate-y-0 ${CHECKED_TONE[tone]}`}
    >
      <input type={type} name={name} value={value} defaultChecked={defaultChecked} disabled={disabled} className="sr-only" />
      {children}
    </label>
  );
}

function OptionChip<T extends string>({
  option,
  ...rest
}: { option: Option<T> } & Omit<Parameters<typeof Chip>[0], "value" | "children">) {
  return (
    <Chip {...rest} value={option.value}>
      <span aria-hidden>{option.emoji}</span>
      {option.label}
    </Chip>
  );
}
