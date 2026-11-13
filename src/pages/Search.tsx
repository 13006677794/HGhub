import { useEffect, useRef, useState } from "react";
import { api, fmt, isIos, isMobile } from "../api";
import type { RankItem, VideoCard } from "../types";
import { useStore } from "../store";
import { Masonry, RankRow } from "../components/cards";
import { Empty, Img } from "../components/ui";
import { IBack, IChevR, IClose, IFireF, ISearch, ITrophy } from "../icons";

const HOT_TAGS = ["古风", "逆袭", "都市", "年代", "职场", "仙侠"];

export default function Search({ active, wide }: { active: boolean; wide: boolean }) {
  const { push, searchHist, addSearch, clearSearchHist, toast } = useStore();
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [items, setItems] = useState<VideoCard[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = useRef(false);

  /* 只在桌面端自动聚焦。手机端自动聚焦会弹出键盘，接下来的第一次点击只是收起键盘、点不到内容。 */
  useEffect(() => {
    if (active && !isMobile) inputRef.current?.focus();
  }, [active]);

  /* 热播榜预览：第一次打开搜索页时才加载 */
  const [hot, setHot] = useState<RankItem[]>([]);
  const hotStarted = useRef(false);
  useEffect(() => {
    if (!active || hotStarted.current) return;
    hotStarted.current = true;
    api.rank("hot").then((res) => setHot((res?.items || []).slice(0, 5))).catch(() => { hotStarted.current = false; });
  }, [active]);
  const openHot = (it: RankItem) => push({ kind: "feed", videoIds: hot.map((x) => x.video_id), index: hot.findIndex((x) => x.video_id === it.video_id), title: "热播榜" });

  const run = async (keyword: string, p: number) => {
    if (busy.current) return;
    if (p > pages && p > 1) return;
    busy.current = true;
    setLoading(true);
    try {
      const res = await api.search(keyword, p, 20);
      setItems((prev) => {
        const base = p === 1 ? [] : prev;
        const seen = new Set(base.map((x) => x.id));
        return [...base, ...(res?.items || []).filter((x) => !seen.has(x.id))];
      });
      setPage(p);
      setPages(res?.pagination?.pages || 1);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message || "搜索失败");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  const submit = (keyword: string) => {
    const k = keyword.trim();
    if (!k) return;
    setSubmitted(k);
    addSearch(k);
    setItems([]);
    setPages(1);
    run(k, 1);
  };

  const querying = submitted.length > 0;

  return (
    <div className="absolute inset-0 bg-bg flex flex-col">
      {/* 搜索栏：iOS 40 高圆角矩形，Android 56 高胶囊 */}
      <div className="shrink-0 px-4 pb-2 flex items-center gap-1.5" style={{ paddingTop: "calc(var(--sat, 0px) + 10px)" }}>
        <form className={`flex-1 flex items-center bg-s2 focus-within:bg-s3 transition-colors ${isIos ? "h-10 gap-2 px-3 rounded-[12px]" : "h-14 gap-3 px-[18px] rounded-full"}`}
          onSubmit={(e) => { e.preventDefault(); submit(q); inputRef.current?.blur(); }}>
          <ISearch size={isIos ? 18 : 21} className="text-dim shrink-0" />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索剧名、题材" aria-label="搜索短剧"
            enterKeyHint="search"
            className="flex-1 min-w-0 bg-transparent text-[16px] text-on placeholder-dim outline-none" />
          {q && <button type="button" aria-label="清空输入" onClick={() => { setQ(""); setSubmitted(""); setItems([]); }} className="w-7 h-7 -mr-1 rounded-full flex items-center justify-center text-mut pressable"><span className="w-5 h-5 rounded-full bg-s4 flex items-center justify-center"><IClose size={11} /></span></button>}
        </form>
        {querying ? (
          <button type="button" onClick={() => { setQ(""); setSubmitted(""); setItems([]); }}
            className="h-11 px-2 text-[16px] text-on pressable">取消</button>
        ) : (
          <button onClick={() => push({ kind: "ranks" })} aria-label="排行榜"
            className="w-11 h-11 rounded-full flex items-center justify-center text-on pressable">
            <ITrophy size={22} />
          </button>
        )}
      </div>

      <div className="flex-1 scroll-y pb-24">
        {!querying ? (
          <>
            {searchHist.length > 0 && (
              <section className="pt-4 a-rise">
                <div className="flex items-center justify-between px-4 mb-2">
                  <h2 className="text-[17px] font-bold text-on">最近搜索</h2>
                  <button onClick={clearSearchHist} className="h-9 pl-3 text-[13px] text-dim pressable">清空</button>
                </div>
                <div className="flex flex-wrap gap-2 px-4">
                  {searchHist.map((h) => (
                    <button key={h} onClick={() => { setQ(h); submit(h); }}
                      className={`px-3.5 h-8 bg-s2 text-[14px] text-mut pressable ${isIos ? "rounded-full" : "rounded-lg"}`}>{h}</button>
                  ))}
                </div>
              </section>
            )}

            <section className="pt-7 a-rise">
              <h2 className="px-4 mb-3 text-[17px] font-bold text-on">按题材找</h2>
              <div className="grid grid-cols-3 gap-2 px-4">
                {HOT_TAGS.map((t) => (
                  <button key={t} onClick={() => { setQ(t); submit(t); }}
                    className="relative h-[72px] overflow-hidden rounded-(--r-md) bg-s1 text-on pressable">
                    <span className="absolute left-3 bottom-2 font-serif text-[18px] font-bold tracking-wide">{t}</span>
                  </button>
                ))}
              </div>
            </section>

            {hot.length > 0 && (
              <section className="pt-7 a-rise">
                <div className="flex items-center justify-between px-4 mb-2">
                  <h2 className="text-[17px] font-bold text-on">热播榜</h2>
                  <button onClick={() => push({ kind: "ranks" })} className="h-9 pl-3 flex items-center gap-0.5 text-[14px] text-mut pressable">完整榜单<IChevR size={14} /></button>
                </div>
                {/* 第 1 名：大卡片 */}
                <button onClick={() => openHot(hot[0])}
                  className="mx-4 w-[calc(100%-2rem)] p-3 rounded-(--r-lg) bg-s1 flex gap-3.5 text-left pressable">
                  <span className="relative w-[84px] h-[112px] rounded-[10px] overflow-hidden bg-s3 shrink-0">
                    <Img src={hot[0].cover} />
                    <span className="absolute left-0 top-0 px-2 py-0.5 rounded-br-[10px] brand-grad font-serif text-[15px] font-bold">1</span>
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-1.5 pt-0.5">
                    <span className="font-serif text-[19px] font-bold text-on leading-snug tracking-wide clamp-1">{hot[0].title}</span>
                    <span className="text-[13px] text-dim truncate">{[hot[0].tags?.[0] || hot[0].cate_name, hot[0].is_finished ? `全 ${hot[0].episode_count} 集` : `${hot[0].episode_count} 集`].filter(Boolean).join(" · ")}</span>
                    <span className="mt-auto flex items-center gap-1 text-[12px] font-semibold text-primary tabular-nums"><IFireF size={13} />热度 {fmt(hot[0].metric_value)}</span>
                  </span>
                </button>
                {/* 第 2–5 名：紧凑列表 */}
                <div className="pt-1.5">
                  {hot.slice(1).map((it) => (
                    <button key={it.video_id} onClick={() => openHot(it)}
                      className="w-full h-[68px] px-4 flex items-center gap-3.5 text-left pressable">
                      <span className={`w-5 text-center font-serif text-[20px] font-bold tabular-nums ${it.rank <= 3 ? "text-on" : "text-dim"}`}>{it.rank}</span>
                      <span className="relative w-10 h-[54px] rounded-md overflow-hidden bg-s3 shrink-0"><Img src={it.cover} /></span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-medium text-on truncate">{it.title}</span>
                        <span className="block text-[12px] text-dim truncate mt-0.5">{it.tags?.slice(0, 2).join(" · ")}</span>
                      </span>
                      <span className="text-[12px] text-dim tabular-nums shrink-0">{fmt(it.metric_value)}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <div className="px-4">
            <div className="text-[13px] text-mut mt-2 mb-3">「{submitted}」共 <span className="text-on font-bold tabular-nums">{items.length}</span> 条结果</div>
            {items.length ? (
              <>
                <Masonry videos={items} wide={wide} onOpen={(v) => push({ kind: "feed", videoIds: items.map((x) => x.id), index: items.findIndex((x) => x.id === v.id), title: `搜索 · ${submitted}` })} />
                <div className="flex justify-center py-4">
                  {loading ? <div className="w-6 h-6 spinner" />
                    : page < pages ? (
                      <button onClick={() => run(submitted, page + 1)} className="px-5 h-11 rounded-(--r-ctl) bg-s3 text-[14px] text-on/85 pressable">加载更多</button>
                    ) : <span className="text-[12px] text-dim">— 已经到底啦 —</span>}
                </div>
              </>
            ) : loading ? (
              <div className="flex justify-center py-12"><div className="w-8 h-8 spinner" /></div>
            ) : (
              <Empty icon={<ISearch size={26} />} title={err || "没有找到相关内容"} sub="换个关键词试试，比如「都市」「逆袭」"
                action="看看热榜" onAction={() => push({ kind: "ranks" })} />
            )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ================= 排行榜 ================= */
const RANK_TABS = [
  { k: "hot", label: "热播榜", desc: "按热力指数排序" },
  { k: "recommend", label: "推荐榜", desc: "按推荐值排序" },
  { k: "potential", label: "潜力榜", desc: "按潜力值排序" },
] as const;

export function RankPage({ onBack, wide }: { onBack: () => void; wide: boolean }) {
  const { push, toast } = useStore();
  const [tab, setTab] = useState<"hot" | "recommend" | "potential">("hot");
  const [items, setItems] = useState<RankItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api.rank(tab)
      .then((res) => { if (alive) setItems(res?.items || []); })
      .catch((e) => { if (alive) { setItems([]); toast((e as Error).message || "榜单加载失败", "info"); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tab, toast]);

  const max = Math.max(1, ...items.map((x) => x.metric_value || 0));
  const meta = RANK_TABS.find((t) => t.k === tab)!;

  return (
    <div className="absolute inset-0 bg-bg flex flex-col">
      <div className="shrink-0 relative overflow-hidden bg-s1" style={{ paddingTop: "var(--sat, 0px)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(90% 120% at 100% 0%, var(--p-pc) 0%, transparent 60%)", opacity: 0.32 }} />
        <div className="relative px-3 pt-2 pb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center text-on hover:bg-s3 pressable"><IBack size={20} /></button>
          <div className="px-2 mt-1 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-(--r-sm) bg-pc text-on-pc flex items-center justify-center"><ITrophy size={20} /></span>
                <span className="font-serif text-[24px] font-bold tracking-wide text-on">HG 热榜</span>
              </div>
              <div className="text-[13px] text-dim mt-1">{meta.desc} · 每 10 分钟更新</div>
            </div>
          </div>
          <div className="flex bg-s3 rounded-(--r-ctl) p-1 mt-3">
            {RANK_TABS.map((t) => (
              <button key={t.k} onClick={() => setTab(t.k)} aria-pressed={tab === t.k}
                className={`flex-1 h-9 rounded-(--r-ctl) text-[14px] font-semibold transition-all ${tab === t.k ? "" : "text-mut"}`}
                style={tab === t.k ? { background: "var(--p-on)", color: "var(--p-bg)" } : undefined}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 scroll-y px-3.5 pt-3 pb-8">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 spinner" /></div>
        ) : items.length ? (
          items.map((it) => (
            <RankRow key={`${it.video_id}-${it.rank}`} item={it} metricMax={max}
              onOpen={() => push({ kind: "feed", videoIds: items.map((x) => x.video_id), index: items.findIndex((x) => x.video_id === it.video_id), title: "HG 热榜" })} />
          ))
        ) : (
          <Empty icon={<ITrophy size={26} />} title="榜单暂时为空" sub="稍后再来看看，或者去首页刷刷推荐" />
        )}
        {wide && <div className="h-2" />}
      </div>
    </div>
  );
}