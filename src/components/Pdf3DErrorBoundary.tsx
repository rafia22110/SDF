import React, { Component, ErrorInfo, ReactNode, useEffect, useState } from "react";
import { Box, RotateCcw, Sparkles, Volume2 } from "lucide-react";
import {
  BUILT_IN_PDF_3D_MODELS,
  Pdf3DModelData,
  PDF_3D_THEME_META,
} from "../services/pdf3dModelBuilder";
import { speak } from "../audio";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackModel?: Pdf3DModelData | null;
  onClose?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class Pdf3DErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || "שגיאה בטעינת תצוגת התלת-ממד",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("Pdf3DErrorBoundary caught 3D error:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      const model = this.props.fallbackModel || BUILT_IN_PDF_3D_MODELS[0];
      const themeMeta =
        PDF_3D_THEME_META[model?.theme || "solar-system"] ||
        PDF_3D_THEME_META["solar-system"];

      return (
        <div className="rounded-3xl border-2 border-sky-400/70 bg-slate-950 text-white p-6 space-y-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center">
                <Box className="w-6 h-6 text-sky-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-sky-400">
                  מַעְבָּדַת מוֹדֶלִים מִ-PDF (מַצַּב תְּצוּגָה בְּטוּחָה)
                </div>
                <h3 className="text-lg font-extrabold text-white nikud">
                  {model.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-glow px-3.5 py-2 rounded-xl bg-sky-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>נַסֵּה שׁוּב בְּתְלַת־מֵמַד</span>
              </button>
              {this.props.onClose && (
                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                >
                  חֲזוֹר לַלּוּחַ
                </button>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-300 nikud">{model.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {model.nodes.slice(0, 4).map((nd, idx) => (
              <div
                key={nd.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 text-xs font-extrabold">
                    תַּחֲנַת יֶדַע {idx + 1} · {themeMeta.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => speak(`${nd.title}. ${nd.fact}`)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 text-sky-300 hover:text-white"
                    title="הקרא בקול"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-sm font-extrabold text-white nikud">
                  {nd.title}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed nikud">
                  {nd.fact}
                </p>
                <div className="pt-1 text-xs font-bold text-amber-300 flex items-center gap-1.5 nikud">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>חִידָה: {nd.question}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const LazyPdf3DModelStudio = React.lazy(() =>
  import("./Pdf3DModelStudio").then((m) => ({ default: m.Pdf3DModelStudio })),
);

export function SafePdf3DStudio(props: {
  initialModel?: Pdf3DModelData | null;
  authorName: string;
  onClose?: () => void;
  onEarnRewards?: (xp: number, stars: number) => void;
}) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="rounded-3xl p-8 bg-slate-950 text-white border border-sky-400/50 text-center text-sm font-bold">
        טוֹעֵן מַעְבָּדַת מוֹדֶלִים בִּתְלַת־מֵמַד...
      </div>
    );
  }

  return (
    <Pdf3DErrorBoundary
      fallbackModel={props.initialModel}
      onClose={props.onClose}
    >
      <React.Suspense
        fallback={
          <div className="rounded-3xl p-8 bg-slate-950 text-white border border-sky-400/50 text-center text-sm font-bold">
            טוֹעֵן מַעְבָּדַת מוֹדֶלִים בִּתְלַת־מֵמַד...
          </div>
        }
      >
        <LazyPdf3DModelStudio {...props} />
      </React.Suspense>
    </Pdf3DErrorBoundary>
  );
}
