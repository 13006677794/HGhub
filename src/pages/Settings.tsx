import { useEffect, useState, type ReactNode } from "react";
import { api, APP_VERSION, hostOf, logLine, type UpdateInfo } from "../api";
import { useStore } from "../store";
import { Modal, Toggle } from "../components/ui";
import LinePicker from "../components/LinePicker";
import { copyPlaybackLog, initPlaybackLog, setPlaybackLog, usePlaybackLog } from "../playbackDiagnostics";
import { IBack, IBoltF, IBroom, IChevR, IHeart, IInfo, ILink, ILockF, IMoon, IRefresh, ISettings, ISun, IVolMute } from "../icons";

/* 独立设置页：线路 / 外观 / 播放 / 本地数据 / 清理缓存 / 网络诊断 / 关于
   入口：Windows 侧栏「设置」、Android「我的」右上角齿轮 */
export default function Settings({ onBack, wide }: { onBack: () => void; wide: boolean }) {
  const { themePref, setTheme, favs, history, muteOnStartup, setMuteOnStartup, strictSecurity, strictSecurityReady, securityPending, cliRelaxed, setStrictSecurity, toast } = useStore();
  const [about, setAbout] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [cacheLabel, setCacheLabel] = useState("128 MB");
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const [lineBase, setLineBase] = useState("");
  const [checking, setChecking] = useState(false);
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const playbackLog = usePlaybackLog();
  const [copyingLog, setCopyingLog] = useState(false);

  const readLine = () => {
    api.lineState().then((s) => setLineBase(s.base)).catch(() => {});
  };
  useEffect(readLine, []);
  useEffect(() => { void initPlaybackLog(); }, []);

  const checkUpdate = async () => {
    setChecking(true);
    try {
      const info = await api.checkUpdate();
      if (info.has_update) setUpdate(info);
      else toast(`已是最新版本 v${info.current}`, "ok");
    } catch (e) {
      toast((e as Error).message || "检查更新失败", "info");
    } finally {
      setChecking(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <>
      <div className="text-[13px] text-dim px-4 mt-5 mb-2">{title}</div>
      <div className="mx-4 rounded-[14px] bg-s1 overflow-hidden">{children}</div>
    </>
  );
  const recordCount = favs.length + history.length;

  return (
    <div className="absolute inset-0 bg-bg flex flex-col">
      <div className="shrink-0 px-2" style={{ paddingTop: "var(--sat, 0px)" }}>
        <button onClick={onBack} className="h-11 px-2 flex items-center gap-0.5 text-[17px] text-on pressable">
          <IBack size={18} />我的
        </button>
        <h1 className="px-3 pb-1 text-[34px] font-bold text-on leading-none">设置</h1>
      </div>

      <div className="flex-1 scroll-y pb-10">
        <div className={wide ? "max-w-[720px] mx-auto" : ""}>
          <Section title="外观">
            <div className="p-3.5 flex flex-col gap-3">
              <span className="text-[16px] text-on">主题</span>
              <div role="radiogroup" aria-label="主题" className="flex p-0.5 rounded-[11px] bg-bg">
                {([["system", "跟随系统"], ["dark", "深色"], ["light", "浅色"]] as const).map(([value, label]) => {
                  const on = themePref === value;
                  return (
                    <button key={value} role="radio" aria-checked={on} onClick={() => setTheme(value)}
                      className={`flex-1 h-8 rounded-[9px] text-[14px] pressable ${on ? "bg-s3 text-on font-semibold shadow-sm" : "text-mut font-medium"}`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </Section>

          <Section title="播放与数据">
            <div className="h-12 pl-3.5 flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-s3 flex items-center justify-center text-mut"><IVolMute size={15} /></span>
              <div className="flex-1 h-12 flex items-center gap-2 pr-3.5">
                <span className="flex-1 text-[16px] text-on">启动时静音</span>
                <Toggle on={muteOnStartup} onChange={setMuteOnStartup} label="启动时静音" />
              </div>
            </div>
            <button onClick={() => setLineOpen(true)} className="w-full h-12 pl-3.5 flex items-center gap-3 text-left pressable">
              <span className="w-7 h-7 rounded-lg bg-s3 flex items-center justify-center text-mut"><IBoltF size={15} /></span>
              <span className="flex-1 h-12 flex items-center gap-2 pr-3.5 border-t border-s3">
                <span className="flex-1 text-[16px] text-on">线路</span>
                <span className="text-[15px] text-dim truncate max-w-[42%]">{lineBase ? hostOf(lineBase) : "固定线路 1"}</span>
                <IChevR size={15} className="text-dim" />
              </span>
            </button>
            <div className="h-12 pl-3.5 flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-s3 flex items-center justify-center text-mut"><IHeart size={15} /></span>
              <div className="flex-1 h-12 flex items-center gap-2 pr-3.5 border-t border-s3">
                <span className="flex-1 text-[16px] text-on">收藏与观看记录</span>
                <span className="text-[15px] text-dim">{recordCount} 条</span>
              </div>
            </div>
            <button onClick={() => setClearOpen(true)} className="w-full h-12 pl-3.5 flex items-center gap-3 text-left pressable">
              <span className="w-7 h-7 rounded-lg bg-s3 flex items-center justify-center text-mut"><IBroom size={15} /></span>
              <span className="flex-1 h-12 flex items-center gap-2 pr-3.5 border-t border-s3">
                <span className="flex-1 text-[16px] text-on">清理缓存</span>
                <span className="text-[15px] text-dim">{cacheLabel}</span>
                <IChevR size={15} className="text-dim" />
              </span>
            </button>
          </Section>

          <Section title="关于">
            <button onClick={checkUpdate} disabled={checking} className="w-full h-12 pl-3.5 flex items-center gap-3 text-left pressable disabled:opacity-60">
              <span className="w-7 h-7 rounded-lg bg-s3 flex items-center justify-center text-mut"><IRefresh size={15} /></span>
              <span className="flex-1 h-12 flex items-center gap-2 pr-3.5">
                <span className="flex-1 text-[16px] text-on">{checking ? "检查中…" : "检查更新"}</span>
                <span className="text-[15px] text-dim">{APP_VERSION}</span>
                <IChevR size={15} className="text-dim" />
              </span>
            </button>
            <button onClick={() => setAdvanced(true)} className="w-full h-12 pl-3.5 flex items-center gap-3 text-left pressable">
              <span className="w-7 h-7 rounded-lg bg-s3 flex items-center justify-center text-mut"><ILockF size={14} /></span>
              <span className="flex-1 h-12 flex items-center gap-2 pr-3.5 border-t border-s3">
                <span className="flex-1 text-[16px] text-on">高级与诊断</span>
                <IChevR size={15} className="text-dim" />
              </span>
            </button>
            <button onClick={() => setAbout(true)} className="w-full h-12 pl-3.5 flex items-center gap-3 text-left pressable">
              <span className="w-7 h-7 rounded-lg bg-s3 flex items-center justify-center text-mut"><IInfo size={15} /></span>
              <span className="flex-1 h-12 flex items-center gap-2 pr-3.5 border-t border-s3">
                <span className="flex-1 text-[16px] text-on">关于 HGhub</span>
                <IChevR size={15} className="text-dim" />
              </span>
            </button>
          </Section>
          <div className="text-center text-[12px] text-dim mt-8">HGhub {APP_VERSION} · 仅限非商业使用</div>
        </div>
      </div>

      <Modal open={advanced} onClose={() => setAdvanced(false)} width={420}>
        <div className="p-4">
          <div className="text-[16px] font-bold text-on mb-3">高级与诊断</div>
          <div className="rounded-[14px] bg-s2 overflow-hidden">
            <div className="flex items-center gap-3 px-3.5 py-3">
              <span className="w-8 h-8 rounded-full bg-s3 flex items-center justify-center text-primary"><ILockF size={15} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] text-on">严格安全模式</div>
                <div className="text-[10.5px] text-mut">
                  {cliRelaxed
                    ? "已由启动参数 --no-strict 切换为兼容模式；可手动重新开启"
                    : "默认开启，防上游投毒与内网探测；若导致正文或特殊代理异常可关闭（或用 --no-strict 启动）"}
                </div>
              </div>
              <Toggle
                on={strictSecurity}
                disabled={!strictSecurityReady || securityPending}
                onChange={(on) => {
                  void setStrictSecurity(on).then(() => {
                    toast(on ? "已开启严格安全模式" : "已切换为兼容模式（关闭激进清洗与守卫）", "info");
                  }).catch(() => toast("安全设置保存失败，已保持原模式", "info"));
                }}
                label="严格安全模式"
              />
            </div>
            {/* 打不开时先点这里：把 DNS / 代理 / HTTP 结果复制给维护者 */}
            <button onClick={async () => {
              try {
                const text = JSON.stringify(await api.netDiag(), null, 2);
                logLine(`[net_diag] ${text}`);
                await navigator.clipboard?.writeText(text);
                toast("网络诊断结果已复制", "ok");
              } catch (e) {
                toast((e as Error).message || "诊断失败", "info");
              }
            }} className="w-full flex items-center gap-3 px-3.5 py-3 text-left pressable">
              <span className="w-8 h-8 rounded-full bg-s3 flex items-center justify-center text-primary"><ILink size={16} /></span>
              <div className="flex-1">
                <div className="text-[12.5px] text-on">网络诊断</div>
                <div className="text-[10.5px] text-mut">检测 DNS / 系统代理 / 官网连通性</div>
              </div>
              <IChevR size={15} className="text-mut" />
            </button>
            <div className="flex items-center gap-3 px-3.5 py-3 border-t border-s3">
              <span className="w-8 h-8 rounded-full bg-s3 flex items-center justify-center text-primary"><IInfo size={16} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] text-on">播放诊断日志</div>
                <div className="text-[10.5px] text-mut">记录点击、拖动、切页和缓冲过程；复现问题后可关闭并复制日志</div>
                {playbackLog.error && <div role="alert" className="text-[10.5px] text-danger">{playbackLog.error}</div>}
              </div>
              <Toggle label="播放诊断日志" on={playbackLog.enabled} disabled={!playbackLog.ready || playbackLog.pending}
                onChange={(on) => { void setPlaybackLog(on).then(() => toast(on ? "已开启播放诊断，请复现问题" : "已关闭播放诊断，已有日志保留", "ok")).catch(() => toast("日志设置保存失败，请重试", "info")); }} />
            </div>
            <button disabled={!playbackLog.ready || playbackLog.pending || copyingLog} onClick={async () => {
              setCopyingLog(true);
              try { await copyPlaybackLog(); toast("播放诊断日志已复制", "ok"); }
              catch (e) { toast((e as Error).message || "复制日志失败", "info"); }
              finally { setCopyingLog(false); }
            }} className="w-full flex items-center gap-3 px-3.5 py-3 text-left pressable disabled:opacity-60">
              <span className="w-8 h-8 rounded-full bg-s3 flex items-center justify-center text-primary"><ILink size={16} /></span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] text-on">{copyingLog ? "正在复制…" : "复制播放诊断日志"}</div>
                <div className="text-[10.5px] text-mut break-all">{playbackLog.path || "日志仅保存在本机"}</div>
              </div>
              <IChevR size={15} className="text-mut" />
            </button>
          </div>
          <button onClick={() => setAdvanced(false)} className="mt-4 w-full h-10 rounded-(--r-ctl) bg-s3 text-[14px] text-on pressable">关闭</button>
        </div>
      </Modal>

      <LinePicker open={lineOpen} onClose={() => { setLineOpen(false); readLine(); }} />

      <Modal open={about} onClose={() => setAbout(false)} width={392}>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-(--r-sm) brand-grad glow-neon flex items-center justify-center text-on-primary text-[17px] font-black">H</span>
            <div>
              <div className="text-[16px] font-bold text-on leading-tight">HGhub</div>
              <div className="text-[11px] text-mut mt-0.5">黄果短剧 · 第三方客户端 v{APP_VERSION}</div>
            </div>
          </div>

          <p className="text-[12px] text-on/70 leading-relaxed mt-4">
            基于 Rust + Tauri 2 构建的跨平台客户端，支持 Windows、macOS 与 Android。
            界面遵循 Fluent 设计语言，播放器采用沉浸式竖屏信息流。
          </p>

          <div className="mt-4 rounded-(--r-sm) bg-s3/60 p-3 text-[11px] text-mut leading-relaxed">
            本项目仅供学习与交流，所有内容均来自上游站点，客户端不存储、不分发任何视频内容。
            请于 24 小时内删除相关资源，并支持正版。
          </div>

          <div className="mt-4 divide-y divide-s3">
            <button onClick={() => { navigator.clipboard?.writeText("https://github.com/Minireel/HGhub").then(() => toast("仓库地址已复制", "ok")).catch(() => {}); }}
              className="w-full flex items-center gap-2 py-2.5 text-left pressable">
              <ILink size={15} className="text-mut" />
              <span className="text-[12px] text-on/85">github.com/Minireel/HGhub</span>
              <span className="ml-auto text-[10.5px] text-primary">复制</span>
            </button>
            <button onClick={() => { navigator.clipboard?.writeText("https://huangguoai.com").then(() => toast("站点地址已复制", "ok")).catch(() => {}); }}
              className="w-full flex items-center gap-2 py-2.5 text-left pressable">
              <ILink size={15} className="text-mut" />
              <span className="text-[12px] text-on/85">huangguoai.com</span>
              <span className="ml-auto text-[10.5px] text-primary">复制</span>
            </button>
            <div className="flex items-center gap-2 py-2.5">
              <IInfo size={15} className="text-mut" />
              <span className="text-[12px] text-on/85">PolyForm Noncommercial 1.0.0</span>
              <span className="ml-auto text-[10.5px] text-mut">仅限非商业</span>
            </div>
            <div className="flex items-center gap-2 py-2.5">
              <IInfo size={15} className="text-mut" />
              <span className="text-[12px] text-on/85">底栏图标：Solar Icons by 480 Design</span>
              <span className="ml-auto text-[10.5px] text-mut">CC BY 4.0</span>
            </div>
          </div>

          <button onClick={() => setAbout(false)} className="mt-4 w-full h-9 rounded-(--r-ctl) bg-s3 text-[12.5px] text-on pressable">知道了</button>
        </div>
      </Modal>

      <Modal open={clearOpen} onClose={() => setClearOpen(false)} width={330}>
        <div className="p-5">
          <div className="text-[14.5px] font-bold text-on">清理缓存</div>
          <p className="text-[12px] text-mut leading-relaxed mt-2">
            只清除封面与播放列表缓存（解密图 / m3u8）。收藏、观看记录、搜索历史与登录状态都会保留。
          </p>
          <div className="flex gap-2 mt-5">
            <button onClick={() => setClearOpen(false)} className="flex-1 h-9 rounded-(--r-ctl) bg-s3 text-[12.5px] text-on/80 pressable">取消</button>
            <button disabled={clearing} onClick={async () => {
              setClearing(true);
              try { await api.clearCache(); setCacheLabel("0 MB"); } catch { /* 忽略 */ }
              setClearing(false);
              setClearOpen(false);
              toast("缓存已清理", "ok");
            }} className="flex-1 h-9 rounded-(--r-ctl) bg-primary text-[12.5px] font-semibold text-on-primary pressable disabled:opacity-60">
              {clearing ? "清理中…" : "确定清理"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!update?.has_update} onClose={() => setUpdate(null)} width={392}>
        <div className="p-5">
          <div className="text-[15px] font-bold text-on">发现新版本</div>
          <p className="text-[11.5px] text-mut mt-1.5">
            v{update?.current} → <b className="text-on">v{update?.latest}</b>
            {update?.published_at ? ` · ${update.published_at.slice(0, 10)}` : ""}
          </p>
          {!!update?.notes && (
            <div className="mt-3 max-h-[180px] scroll-y rounded-(--r-sm) bg-s2 p-3 text-[11px] text-mut whitespace-pre-wrap leading-relaxed">{update.notes}</div>
          )}
          <div className="flex gap-2 mt-4">
            <button onClick={() => setUpdate(null)} className="flex-1 h-9 rounded-(--r-ctl) bg-s3 text-[12.5px] text-on/80 pressable">稍后</button>
            <button onClick={() => {
              if (!update) return;
              api.openUrl(update.url).catch(() => {
                navigator.clipboard?.writeText(update.url).then(() => toast("下载地址已复制", "ok")).catch(() => {});
              });
            }} className="flex-1 h-9 rounded-(--r-ctl) bg-primary text-[12.5px] font-semibold text-on-primary pressable">前往下载</button>
          </div>
          <div className="text-[10px] text-dim mt-2.5 break-all">{update?.url}</div>
        </div>
      </Modal>
    </div>
  );
}
