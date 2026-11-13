import { useState } from "react";
import { useStore } from "../store";

const FILTERS = ["全部", "剧中角色", "原创", "剧情助手"] as const;

const CONTINUED = [
  { name: "沈知意", play: "雪落长安", when: "2 分钟前", line: "那就明天，城门下见。", unread: 2 },
  { name: "林曜", play: "夜航", when: "昨天", line: "降落之前，再陪我说会儿话吧。", unread: 0 },
];

const ROLES = [
  { name: "沈知意", play: "雪落长安", line: "雪夜立誓的侯府庶女，今天想听你说说长安。", chats: "8.6万", wash: "linear-gradient(165deg,#3a2a22,#120c0a)" },
  { name: "林曜", play: "夜航", line: "凌晨三点的驾驶舱，只有你和星星。", chats: "5.2万", wash: "linear-gradient(165deg,#16324a,#071018)" },
  { name: "顾昭", play: "第七次重生", line: "第七次了，这一次你站哪边？", chats: "12.4万", wash: "linear-gradient(165deg,#4a1c24,#14080c)" },
  { name: "白先生", play: "云上书", line: "藏书阁主人。问一卷书，或一个答案。", chats: "3.9万", wash: "linear-gradient(165deg,#1a4232,#06130d)" },
];

/* 爱聊还没有对话接口。页面按草图摆好，点角色只提示即将上线。 */
export default function Chat() {
  const { toast } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("全部");
  const roles = filter === "剧情助手" || filter === "原创" ? [] : ROLES;
  const open = (name: string) => toast(`${name} 的对话即将上线`, "info");

  return (
    <div className="absolute inset-0 bg-bg flex flex-col">
      <div className="shrink-0 px-4 pb-1 flex items-end gap-2.5" style={{ paddingTop: "calc(var(--sat, 0px) + 14px)" }}>
        <h1 className="text-[28px] font-bold text-on leading-none">爱聊</h1>
        <span className="pb-0.5 text-[13px] text-dim">和剧中角色聊天</span>
      </div>

      <div className="flex-1 scroll-y pb-24">
        <div className="flex gap-2 px-4 pt-3">
          {FILTERS.map((name) => (
            <button key={name} aria-pressed={filter === name} onClick={() => setFilter(name)}
              className={`h-8 px-3.5 rounded-full text-[13px] pressable ${filter === name ? "bg-on text-bg font-semibold" : "bg-s2 text-mut"}`}>
              {name}
            </button>
          ))}
        </div>

        {filter === "全部" && (
          <section className="pt-6">
            <h2 className="px-4 mb-2 font-serif text-[20px] font-bold tracking-wide text-on">继续聊</h2>
            {CONTINUED.map((item) => (
              <button key={item.name} onClick={() => open(item.name)} className="w-full px-4 h-[72px] flex items-center gap-3 text-left pressable">
                <span className="w-11 h-11 rounded-full bg-s3 text-on font-serif text-[18px] font-bold flex items-center justify-center shrink-0">{item.name.slice(0, 1)}</span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="text-[16px] font-semibold text-on">{item.name}</span>
                    <span className="text-[12px] text-dim">《{item.play}》</span>
                    <span className="ml-auto text-[12px] text-dim">{item.when}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] text-mut truncate">{item.line}</span>
                </span>
                {item.unread > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-on text-bg text-[11px] font-bold flex items-center justify-center">{item.unread}</span>}
              </button>
            ))}
          </section>
        )}

        <section className="pt-6">
          <div className="px-4 mb-3 flex items-baseline">
            <h2 className="font-serif text-[20px] font-bold tracking-wide text-on">发现角色</h2>
            <span className="ml-auto text-[13px] text-dim">按热度</span>
          </div>
          {roles.length ? (
            <div className="grid grid-cols-2 gap-2.5 px-4">
              {roles.map((role) => (
                <button key={role.name} onClick={() => open(role.name)} className="rounded-(--r-lg) bg-s1 overflow-hidden text-left pressable">
                  <span className="relative block h-[150px]" style={{ background: role.wash }}>
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute left-3 bottom-7 font-serif text-[24px] font-bold tracking-wide text-white">{role.name}</span>
                    <span className="absolute left-3 bottom-2.5 text-[12px] text-white/70">《{role.play}》</span>
                  </span>
                  <span className="block px-3 pt-2.5 pb-3">
                    <span className="block h-[38px] text-[13px] leading-snug text-mut clamp-2">{role.line}</span>
                    <span className="mt-2 block text-[12px] text-dim tabular-nums">{role.chats} 次对话</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="px-4 text-[13px] text-dim">这一类还没有角色。</p>
          )}
        </section>
      </div>
    </div>
  );
}
