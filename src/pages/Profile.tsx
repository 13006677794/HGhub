import { useEffect, useState } from "react";
import { api, APP_VERSION, fmt, fmtTime, isIos, isMobile, platform } from "../api";
import type { Detail } from "../types";
import { useStore } from "../store";
import { Avatar, Empty, Img } from "../components/ui";
import { IClock, ILogout, IPlayF, ISettings, IStar, IUser } from "../icons";

/* 我的：结构固定（资料卡 + 我的收藏 / 观看历史）。
   收藏与观看记录都存在本地，所以未登录也照常展示；未登录时资料卡本身就是登录入口。 */
export default function Profile({ wide }: { wide: boolean }) {
  const { user, setLoginOpen, logout, history, favs, likes, clearHistory, push } = useStore();
  const [tab, setTab] = useState<"fav" | "history">("history");
  const [cards, setCards] = useState<Detail[]>([]);
  const [loading, setLoading] = useState(false);

  const ids = tab === "fav" ? favs : history.map((h) => h.id);
  /** 观看记录里这条的进度（收藏页没有） */
  const progressOf = (id: number) => (tab === "history" ? history.find((h) => h.id === id) : undefined);

  useEffect(() => {
    let alive = true;
    if (!ids.length) { setCards([]); return; }
    setLoading(true);
    Promise.allSettled(ids.slice(0, 12).map((id) => api.video(id)))
      .then((rs) => {
        if (!alive) return;
        setCards(rs.filter((r) => r.status === "fulfilled").map((r) => (r as PromiseFulfilledResult<Detail>).value));
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ids.join(",")]);

  /* 继续观看：最近看的那一部（观看记录第一条） */
  const last = history[0];
  const [lastCard, setLastCard] = useState<Detail | null>(null);
  useEffect(() => {
    let alive = true;
    if (!last) { setLastCard(null); return; }
    api.video(last.id).then((d) => { if (alive) setLastCard(d); }).catch(() => { if (alive) setLastCard(null); });
    return () => { alive = false; };
  }, [last?.id]);
  const lastPct = last && last.dur > 0 ? Math.min(100, Math.round((last.t / last.dur) * 100)) : 0;

  const stats: [string | number, string][] = user
    ? [[fmt(user.counts?.like), "点赞"], [fmt(user.counts?.collect), "收藏"], [fmt(user.counts?.following), "关注"]]
    : [[history.length, "看过"], [favs.length, "收藏"], [likes.length, "点赞"]];

  return (
    <div className="absolute inset-0 bg-bg flex flex-col">
      <div className="shrink-0 px-4 pb-2 flex items-center" style={{ paddingTop: "calc(var(--sat, 0px) + 14px)" }}>
        <h1 className="text-[24px] font-bold text-on leading-none">我的</h1>
        {isMobile && (
          <button onClick={() => push({ kind: "settings" })} aria-label="设置"
            className="ml-auto -mr-2 w-11 h-11 rounded-full flex items-center justify-center text-on pressable">
            <ISettings size={22} strokeWidth={1.7} />
          </button>
        )}
      </div>

      <div className="flex-1 scroll-y px-4 pt-2 pb-24">
        {/* 资料行：已登录 / 未登录（未登录时整行就是登录入口） */}
        {user ? (
          <div className="flex items-center gap-3.5 a-rise">
            <Avatar size={56} name={user.nickname} hue={280} />
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-bold text-on truncate">{user.nickname}</div>
              <div className="text-[13px] text-dim mt-0.5 truncate">@{user.username} · ID {user.id}</div>
            </div>
            <button onClick={async () => { await logout(); }}
              className="w-11 h-11 -mr-2 rounded-full flex items-center justify-center text-mut pressable" aria-label="退出登录">
              <ILogout size={20} />
            </button>
          </div>
        ) : (
          <button onClick={() => setLoginOpen(true)}
            className="w-full text-left flex items-center gap-3.5 pressable a-rise">
            <Avatar size={56} icon={<IUser size={26} />} hue={220} />
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-bold text-on">未登录</div>
              <div className="text-[13px] text-dim mt-0.5">登录后同步收藏和观看记录</div>
            </div>
            <span className="h-9 px-4 rounded-full flex items-center text-[14px] font-semibold text-on" style={{ border: "1px solid var(--p-s4)" }}>登录</span>
          </button>
        )}
        <div className="flex gap-10 pt-5" style={{ paddingLeft: 70 }}>
          {stats.map(([n, l]) => (
            <div key={l}>
              <div className="text-[20px] font-bold text-on tabular-nums leading-tight">{n}</div>
              <div className="text-[12px] text-dim mt-0.5">{l}</div>
            </div>
          ))}
        </div>

        {/* 继续观看：最近看的那一部 */}
        {last && lastCard && (
          <section className="pt-7 a-rise">
            <h2 className="mb-3 text-[17px] font-bold text-on">继续观看</h2>
            <button onClick={() => push({ kind: "feed", videoIds: [lastCard.id], index: 0, title: "继续观看", startEp: last.ep, startTime: last.t })}
              className="relative block w-full h-[184px] rounded-(--r-lg) overflow-hidden bg-s1 text-left pressable">
              <Img src={lastCard.cover} />
              <span className="absolute inset-0" style={{ background: "linear-gradient(0deg, rgba(0,0,0,.82) 0%, rgba(0,0,0,.25) 60%, rgba(0,0,0,.1) 100%)" }} />
              <span className="absolute left-4 right-4 bottom-[18px] flex items-end gap-3">
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] hg-ink-3 tabular-nums">上次看到 · 第 {last.ep} 集{last.t > 3 ? ` ${fmtTime(last.t)}` : ""}</span>
                  <span className="block mt-1 font-serif text-[24px] font-bold leading-tight tracking-wide hg-ink clamp-1">{lastCard.title}</span>
                </span>
                <span className="hg-on-photo-btn h-10 px-4 rounded-full flex items-center gap-1.5 text-[14px] font-bold shrink-0"><IPlayF size={13} />继续</span>
              </span>
              {lastPct > 0 && (
                <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: "rgba(255,255,255,.18)" }}>
                  <span className="block h-full" style={{ width: `${lastPct}%`, background: "#e6e9ee" }} />
                </span>
              )}
            </button>
          </section>
        )}

        {/* 我的内容：iOS 用大字标签，Android 用带下划线指示条的标签页 */}
        {isIos || !isMobile ? (
          <div role="tablist" className="flex gap-6 h-11 items-center mt-6">
            {([["history", "观看历史"], ["fav", "我的收藏"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`h-11 text-[17px] pressable ${tab === k ? "font-bold text-on" : "font-semibold text-dim"}`}>{l}</button>
            ))}
          </div>
        ) : (
          <div role="tablist" className="flex h-12 mt-5" style={{ borderBottom: "1px solid var(--p-s3)" }}>
            {([["history", "观看历史"], ["fav", "我的收藏"]] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`relative flex-1 text-[14px] pressable ${tab === k ? "font-semibold text-on" : "font-medium text-dim"}`}>
                {l}
                {tab === k && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-12 h-[3px] rounded-t-[3px] bg-on" />}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-7 h-7 spinner" /></div>
          ) : cards.length ? (
            <div className="grid grid-cols-3 gap-2.5">
              {cards.map((c) => {
                const p = progressOf(c.id);
                return (
                <button key={c.id} onClick={() => push({
                  kind: "feed", videoIds: cards.map((x) => x.id), index: cards.findIndex((x) => x.id === c.id),
                  title: tab === "fav" ? "我的收藏" : "观看历史",
                  startEp: p?.ep, startTime: p?.t,
                })}
                  className="relative rounded-[10px] overflow-hidden bg-s1 pressable" style={{ paddingTop: "134%" }}>
                  <Img src={c.cover} />
                  {!!p && (
                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full bg-black/65 text-[11px] text-white/90 leading-none tabular-nums">
                      第 {p.ep} 集{p.t > 3 ? ` · ${fmtTime(p.t)}` : ""}
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5">
                    <div className="text-[12px] text-white clamp-2 leading-tight">{c.title}</div>
                  </div>
                </button>
                );
              })}
            </div>
          ) : (
            <Empty icon={tab === "fav" ? <IStar size={24} /> : <IClock size={24} />}
              title={tab === "fav" ? "还没有收藏" : "还没有观看记录"}
              sub={tab === "fav" ? "在剧集页点收藏，之后就能在这里找到" : "看过的剧集会出现在这里"}
              action="去逛逛" onAction={() => push({ kind: "ranks" })} />
          )}
          {cards.length > 0 && tab === "history" && (
            <button onClick={clearHistory} className="mt-4 w-full h-11 rounded-(--r-ctl) bg-s2 text-[14px] text-mut pressable">清空观看历史</button>
          )}
        </div>

        <div className="text-center text-[12px] text-dim mt-6">HGhub {APP_VERSION} · {platform === "android" ? "Android" : platform === "ios" ? "iOS" : platform === "macos" ? "macOS" : "Windows"} 客户端</div>
      </div>
    </div>
  );
}