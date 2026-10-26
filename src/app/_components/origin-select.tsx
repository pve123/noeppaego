"use client";

import { useRouter } from "next/navigation";

/** 출발지 고르기 — 고르면 바로 다시 찾는다(주소에 ?from= 으로 남아 공유된다) */
export function OriginSelect({
  origins,
  selected,
  basePath,
}: {
  origins: { id: string; name: string }[];
  selected: string;
  basePath: string;
}) {
  const router = useRouter();
  return (
    <label className="inline-flex flex-wrap items-center gap-2 font-bold">
      어디서 출발하세요?
      <select
        value={selected}
        onChange={(e) => router.push(`${basePath}?from=${e.target.value}`, { scroll: false })}
        className="h-11 rounded-full border-[2.5px] border-ink bg-surface px-4 font-display text-[17px] font-normal"
      >
        {origins.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </label>
  );
}
