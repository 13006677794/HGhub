import { ITabChat } from "../icons";

/* 爱聊：AI 角色聊天入口。功能内容待定，先放占位页。 */
export default function Chat() {
  return (
    <div className="absolute inset-0 bg-bg flex flex-col">
      <div className="shrink-0 px-4 pb-1 flex items-baseline gap-2.5" style={{ paddingTop: "calc(var(--sat, 0px) + 14px)" }}>
        <h1 className="text-[24px] font-bold text-on leading-none">爱聊</h1>
        <span className="text-[13px] text-dim">和剧中角色聊天</span>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-10 pb-24 text-center">
        <span className="w-16 h-16 rounded-full bg-s2 text-mut flex items-center justify-center">
          <ITabChat size={30} />
        </span>
        <div className="font-serif text-[22px] font-bold text-on tracking-wider">即将上线</div>
        <p className="text-[13px] leading-relaxed text-mut">在这里可以和剧中角色聊天，内容还在准备中。</p>
      </div>
    </div>
  );
}
