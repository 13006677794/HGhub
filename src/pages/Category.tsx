import { useCallback, useEffect, useRef, useState } from "react";
import { api, fmt } from "../api";
import type { Post, VideoCard } from "../types";
import { useStore } from "../store";
import { Masonry, RowCard } from "../components/cards";
import { Empty, Img } from "../components/ui";
import { IBack, IChevR, IGrid, ITrophy } from "../icons";

export const CHANNELS = [
  { cate: "ai-duanju", name: "AI成人短剧", desc: "高能反转 · 一口气看完" },
  { cate: "ai-manju", name: "AI成人漫剧", desc: "国创漫剧 · 每周更新" },
] as const;

/* ================= 分类总览 ================= */
export default function Category({ wide, active }: { wide: boolean; active: boolean }) {
  const { push } = useStore();
  const [rows, setRows] = useState<Record<string, VideoCard[]>>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mounted = useRef(false);
  const started = useRef(false);
  const pending = useRef(new Set<string>());

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const loadPreview = useCallback(async (key: string) => {
    if (pending.current.has(key)) return;
    pending.current.add(key);
    setLoading(m => ({ ...m, [key]: true }));
    setErrors(m => ({ ...m, [key]: "" }));
    try {
      if (key === "posts") {
        const result = await api.posts(1, 8);
        if (mounted.current) setPosts(result?.items || []);
      } else {
        const result = await api.category(key, 1, 8);
        if (mounted.current) setRows(m => ({ ...m, [key]: result?.items || [] }));
      }
    } catch (error) {
      if (mounted.current) setErrors(m => ({ ...m, [key]: (error as Error).message || "加载失败" }));
    } finally {
      pending.current.delete(key);
      if (mounted.current) setLoading(m => ({ ...m, [key]: false }));
    }
  }, []);

  useEffect(() => {
    // 首次打开分类才加载，避免启动时后台频道请求/封面与首页视频竞争网络。
    if (!active || started.current) return;
    started.current = true;
    CHANNELS.forEach(c => { void loadPreview(c.cate); });
    void loadPreview("posts");
  }, [active, loadPreview]);

  /* 排行榜入口右侧的三张小封面：取第一个已加载频道的前三部 */
  const fan = (CHANNELS.map(c => rows[c.cate] || []).find(l => l.length >= 3) || []).slice(0, 3).map(v => v.cover);

  return (
    <div className="absolute inset-0 bg-bg flex flex-col">
      <div className="shrink-0 px-4 pb-1" style={{ paddingTop: "calc(var(--sat, 0px) + 14px)" }}>
        <div className="flex items-end gap-2.5">
          <h1 className="text-[28px] font-bold text-on leading-none">分类</h1>
          <span className="text-[13px] text-dim">{CHANNELS.length + 1} 个频道 · 每周上新</span>
        </div>
      </div>

      <div className="flex-1 scroll-y pb-24 pt-2">
        {/* 排行榜入口：右侧叠三张已加载的封面 */}
        <button onClick={() => push({ kind: "ranks" })}
          className="mx-4 mb-7 w-[calc(100%-2rem)] h-[76px] flex items-center gap-3.5 rounded-(--r-lg) bg-s1 px-3.5 text-left pressable">
          <span className="w-10 h-10 rounded-(--r-md) flex items-center justify-center shrink-0 text-primary" style={{ background: "var(--p-tint)" }}><ITrophy size={21} /></span>
          <span className="flex-1 min-w-0">
            <span className="block text-[16px] font-bold text-on">排行榜</span>
            <span className="block text-[13px] text-dim mt-0.5">热播 · 推荐 · 潜力</span>
          </span>
          {fan.length === 3 && (
            <span className="relative w-[74px] h-[52px] shrink-0" aria-hidden>
              {fan.map((src, i) => (
                <span key={src + i} className="absolute w-[34px] h-[46px] rounded-md overflow-hidden bg-s3"
                  style={{ left: i * 18, top: i === 1 ? 0 : 6, transform: `rotate(${(i - 1) * 8}deg)`, boxShadow: "0 4px 12px rgba(0,0,0,.4)" }}>
                  <Img src={src} />
                </span>
              ))}
            </span>
          )}
          <IChevR size={16} className="text-dim shrink-0" />
        </button>

        {(() => {
          const featured = CHANNELS.map((c) => rows[c.cate]?.[0]).find(Boolean);
          if (!featured) return null;
          const list = CHANNELS.flatMap((c) => rows[c.cate] || []);
          return (
            <button onClick={() => push({ kind: "feed", videoIds: list.map((x) => x.id), index: Math.max(0, list.findIndex((x) => x.id === featured.id)), title: "本周上新" })}
              className="mx-4 mb-7 block w-[calc(100%-2rem)] overflow-hidden rounded-(--r-lg) bg-s1 text-left pressable">
              <span className="relative block h-[168px]">
                <Img src={featured.cover} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute left-4 top-4 font-serif text-[20px] font-bold tracking-wide text-white">本周上新</span>
                <span className="absolute right-4 top-4 font-serif text-[15px] font-bold text-white tsh" style={{ writingMode: "vertical-rl", letterSpacing: ".12em" }}>{featured.title}</span>
                <span className="absolute left-4 bottom-4">
                  <span className="block text-[12px] text-white/70">最新上架</span>
                  <span className="mt-1 block font-serif text-[22px] font-bold text-white">{featured.title}</span>
                  <span className="mt-1 block text-[13px] text-white/70">{featured.tags?.[0] || "短剧"} · {featured.is_finished ? `全 ${featured.total_episodes || featured.episode_count} 集` : `更新至 ${featured.episode_count}`}</span>
                </span>
              </span>
            </button>
          );
        })()}

        {CHANNELS.map((c, ci) => {
          const list = rows[c.cate] || [];
          return (
            <section key={c.cate} aria-label={c.name} className="mb-7 a-rise" style={{ animationDelay: `${Math.min(ci * 50, 300)}ms` }}>
              <button onClick={() => push({ kind: "channel", cate: c.cate, name: c.name })}
                className="w-full min-h-11 flex items-baseline gap-2 px-4 mb-2 text-left pressable">
                <span className="font-serif text-[20px] font-bold text-on tracking-wide shrink-0">{c.name}</span>
                <span className="flex-1 min-w-0 text-[13px] text-dim truncate">{c.desc}</span>
                <span className="flex items-center gap-0.5 text-[14px] text-mut shrink-0 self-center">
                  全部<IChevR size={14} />
                </span>
              </button>
              <div className="scroll-x flex gap-2.5 px-4 snap-x">
                {list.map((v) => (
                  <RowCard key={v.id} v={v} onOpen={() => push({ kind: "feed", videoIds: list.map((x) => x.id), index: list.findIndex((x) => x.id === v.id), title: c.name })} />
                ))}
                {!list.length && <PreviewStatus name={c.name} loading={loading[c.cate] !== false} error={errors[c.cate]} onRetry={() => void loadPreview(c.cate)} />}
              </div>
            </section>
          );
        })}

        {/* 吃瓜 */}
        <section aria-label="黄果吃瓜" className="mb-7 a-rise">
          <button onClick={() => push({ kind: "posts" })}
            className="w-full min-h-11 flex items-baseline gap-2 px-4 mb-2 text-left pressable">
            <span className="font-serif text-[20px] font-bold text-on tracking-wide shrink-0">黄果吃瓜</span>
            <span className="flex-1 min-w-0 text-[13px] text-dim truncate">圈内爆料 · 每日更新</span>
            <span className="flex items-center gap-0.5 text-[14px] text-mut shrink-0 self-center">
              全部<IChevR size={14} />
            </span>
          </button>
          <div className="scroll-x flex gap-2.5 px-4 snap-x">
            {posts.map((post) => (
              <button key={post.id} onClick={() => push({ kind: "post", id: post.id })}
                className="w-[112px] shrink-0 text-left snap-start pressable">
                <div className="relative w-full rounded-[10px] overflow-hidden bg-s1" style={{ paddingTop: "134%" }}>
                  <Img src={post.cover} />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 to-transparent" />
                  <span className="absolute bottom-1.5 right-1.5 text-[11px] font-semibold text-white/90 tsh tabular-nums">{fmt(post.hot)}</span>
                </div>
                <div className="mt-1.5 text-[14px] font-medium text-on clamp-1 leading-tight">{post.title}</div>
              </button>
            ))}
            {!posts.length && <PreviewStatus name="黄果吃瓜" loading={loading.posts !== false} error={errors.posts} onRetry={() => void loadPreview("posts")} />}
          </div>
        </section>

        <div className="px-4 text-center text-[12px] text-dim pt-1">— 已展示全部频道 —</div>
      </div>
      {wide && <div />}
    </div>
  );
}

function PreviewStatus({ name, loading, error, onRetry }: { name: string; loading: boolean; error?: string; onRetry: () => void }) {
  return <div className="h-[150px] flex flex-col justify-center items-start gap-2 text-[13px] text-dim px-1">
    <span>{loading ? "加载中…" : error || "暂无内容"}</span>
    {!loading && error && <button aria-label={`重试${name}`} onClick={onRetry} className="h-9 px-3 -ml-3 text-primary font-medium pressable">重试</button>}
  </div>;
}

/* ================= 频道详情页 ================= */
export function ChannelPage({ cate, name, onBack, wide }: { cate: string; name: string; onBack: () => void; wide: boolean }) {
  const { push } = useStore();
  const [sort, setSort] = useState<"最新" | "最热" | "高分">("最新");
  const [items, setItems] = useState<VideoCard[]>([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const busy = useRef(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = async () => {
    if (busy.current || page >= pages) return;
    busy.current = true;
    setLoading(true);
    try {
      const next = page + 1;
      const res = await api.category(cate, next, 20);
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        return [...prev, ...(res?.items || []).filter((x) => !seen.has(x.id))];
      });
      setPage(next);
      setPages(res?.pagination?.pages || next);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message || "加载失败");
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  useEffect(() => { loadMore(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) loadMore(); }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pages]);

  const sorted = [...items].sort((a, b) => {
    if (sort === "最热") return (b.hot || 0) - (a.hot || 0);
    if (sort === "高分") return (b.score || 0) - (a.score || 0);
    return b.id - a.id;
  });

  return (
    <div className="absolute inset-0 bg-bg flex flex-col">
      <div className="shrink-0 bg-s1" style={{ paddingTop: "var(--sat, 0px)" }}>
        <div className="px-3 pt-2 pb-3 flex items-center gap-2.5">
          <button onClick={onBack} className="w-10 h-10 rounded-full flex items-center justify-center text-on hover:bg-s3 pressable"><IBack size={20} /></button>
          <span className="w-[40px] h-[40px] rounded-(--r-sm) bg-pc text-on-pc flex items-center justify-center"><IGrid size={21} strokeWidth={1.9} /></span>
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold text-on leading-tight">{name}</div>
            <div className="text-[12px] text-dim">共 {items.length} 部 · 已加载 {page}/{Math.max(pages, 1)} 页</div>
          </div>
        </div>
        <div className="px-4 pb-3 flex gap-2">
          {(["最新", "最热", "高分"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)}
              aria-pressed={sort === s}
              className={`px-4 h-9 rounded-(--r-ctl) text-[14px] pressable ${sort === s ? "font-semibold" : "bg-s3 text-mut font-medium"}`}
              style={sort === s ? { background: "var(--p-on)", color: "var(--p-bg)" } : undefined}>{s}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 scroll-y px-4 pt-3 pb-8">
        {sorted.length ? (
          <Masonry videos={sorted} wide={wide} onOpen={(v) => push({ kind: "feed", videoIds: sorted.map((x) => x.id), index: sorted.findIndex((x) => x.id === v.id), title: name })} />
        ) : err ? (
          <Empty icon={<IGrid size={26} />} title="加载失败" sub={err} action="重试" onAction={loadMore} />
        ) : (
          <div className="flex justify-center py-10"><div className="w-8 h-8 spinner" /></div>
        )}
        <div ref={sentinel} className="h-10" />
        {loading && <div className="flex justify-center py-3"><div className="w-6 h-6 spinner" /></div>}
        {!loading && page >= pages && sorted.length > 0 && (
          <div className="text-center text-[12px] text-dim py-3">— 已经到底啦 —</div>
        )}
      </div>
    </div>
  );
}
