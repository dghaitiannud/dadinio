import { Settings, Check } from "lucide-react";
import { QualityLevel } from "./types"; // On va créer ce fichier juste après
import { useTranslation } from "react-i18next";
interface PlayerSettingsProps {
  showSettingsMenu: boolean;
  setShowSettingsMenu: (val: boolean) => void;
  streamType: "mp4" | "hls";
  levels: QualityLevel[];
  currentQualityIndex: number;
  autoTargetHeight: number | null;
  changeQuality: (idx: number) => void;
  playbackSpeed: number;
  changeSpeed: (speed: number) => void;
}

export function PlayerSettings({
  showSettingsMenu, setShowSettingsMenu, streamType, levels,
  currentQualityIndex, autoTargetHeight, changeQuality,
  playbackSpeed, changeSpeed
}: PlayerSettingsProps) {const { t } = useTranslation();
  return (
    <div className="absolute top-3 right-3 z-50">
      <button
        type="button"
        onClick={() => setShowSettingsMenu(!showSettingsMenu)}
        className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white/80 hover:text-white border border-white/10 transition-all shadow-md">
        
        <Settings className="h-4 w-4" />
      </button>

      {showSettingsMenu &&
      <div className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-900/95 backdrop-blur-md border border-white/15 p-2 shadow-2xl z-50 text-xs text-white max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
          {streamType === "hls" && levels.length > 0 &&
        <div className="mb-2">
              <div className="font-semibold text-zinc-400 uppercase text-[10px] px-2 py-1">
                {t("Résolution")}
              </div>
              <button
            type="button"
            onClick={() => changeQuality(-1)}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-white/10 ${
            currentQualityIndex === -1 ? "text-primary font-bold" : "text-zinc-200"}`
            }>
            
                <span>{autoTargetHeight ? `Auto (${autoTargetHeight}p)` : "Auto (Débit)"}</span>
                {currentQualityIndex === -1 && <Check className="h-3 w-3" />}
              </button>
              {[...levels].sort((a, b) => a.height - b.height).map((lvl) =>
          <button
            key={lvl.id}
            type="button"
            onClick={() => changeQuality(lvl.id)}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-white/10 ${
            currentQualityIndex === lvl.id ? "text-primary font-bold" : "text-zinc-200"}`
            }>
            
                  <span>{lvl.label}</span>
                  {currentQualityIndex === lvl.id && <Check className="h-3 w-3" />}
                </button>
          )}
              <div className="my-1 border-t border-white/10" />
            </div>
        }
          <div>
            <div className="font-semibold text-zinc-400 uppercase text-[10px] px-2 py-1">
              Vitesse
            </div>
            {[0.75, 1, 1.25, 1.5, 2].map((s) =>
          <button
            key={s}
            type="button"
            onClick={() => changeSpeed(s)}
            className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between hover:bg-white/10 ${
            playbackSpeed === s ? "text-primary font-bold" : "text-zinc-200"}`
            }>
            
                <span>{s === 1 ? "Normal (1x)" : `${s}x`}</span>
                {playbackSpeed === s && <Check className="h-3 w-3" />}
              </button>
          )}
          </div>
        </div>
      }
    </div>);

}