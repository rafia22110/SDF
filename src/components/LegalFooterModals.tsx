import React, { useState } from "react";
import { FileCheck2, Lock, ShieldCheck, X } from "lucide-react";

export function LegalFooter({
  onOpenAuth,
}: {
  onOpenAuth: () => void;
}) {
  const [modalType, setModalType] = useState<"privacy" | "terms" | null>(null);

  return (
    <>
      <footer className="mt-10 border-t border-slate-200/80 glass-strong py-5 px-6 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              אִיֵּי אוֹר (SDF) · סְבִיבַת לְמִידָה בְּטוּחָה ומוּגֶנֶת לִילָדִים וּבָתֵּי סֵפֶר (לְלֹא פִּרְסוֹמוֹת)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 font-bold">
            <button
              type="button"
              onClick={() => setModalType("privacy")}
              className="text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>מְדִינִיּוּת פְּרָטִיּוּת לִילָדִים וּבָתֵּי סֵפֶר</span>
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setModalType("terms")}
              className="text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>תְּנָאֵי שִׁימּוּשׁ</span>
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-emerald-700 hover:text-emerald-900 hover:underline"
            >
              רִישׁוּם חִינָּמִי לְמוֹרִים וְהוֹרִים
            </button>
          </div>
        </div>
      </footer>

      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-strong rounded-3xl p-6 md:p-8 max-w-lg w-full border-2 border-sky-300 shadow-2xl space-y-4 animate-pop">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>
                  {modalType === "privacy"
                    ? "מְדִינִיּוּת פְּרָטִיּוּת לִילָדִים וּבָתֵּי סֵפֶר"
                    : "תְּנָאֵי שִׁימּוּשׁ בְּאִיֵּי אוֹר"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalType === "privacy" ? (
              <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                <p>
                  <strong>1. סְבִיבָה נְקִיָּה מִפִּרְסוֹמוֹת וּמַעֲקָב מִסְחָרִי:</strong> מַעֲרֶכֶת &quot;אִיֵּי אוֹר&quot; פּוּתְּחָה עֲבוּר תַּלְמִידֵי בָּתֵּי סֵפֶר יְסוֹדִיִּים (כִּיתּוֹת א׳–ו׳). אֵין בַּמַּעֲרֶכֶת פִּרְסוֹמוֹת צַד-שְׁלִישִׁי וְלֹא מִתְבַּצֵּעַ סַחַר בְּמֵידָע אִישִׁי.
                </p>
                <p>
                  <strong>2. הַפְרָדַת הַרְשָׁאוֹת קְשִׁיחָה (PocketBase RBAC):</strong> תַּלְמִידִים רוֹאִים רַק אֶת מֶרְחַב הַלְּמִידָה וְהַהִתְקַדְּמוּת הָאִישִׁית שֶׁלָּהֶם. מִמְשַׁק &quot;נִיהוּל לַמּוֹרֶה&quot; נָעוּל וּמוּגָן לְמִשְׁתַּמְּשִׁים בַּעֲלֵי הַרְשָׁאַת מוֹרֶה בִּלְבַד.
                </p>
                <p>
                  <strong>3. מִינִימוּם מֵידָע נִדְרָשׁ:</strong> הַרְשָׁמַת תַּלְמִיד דּוֹרֶשֶׁת שֵׁם פְּרָטִי/כִּינּוּי, כִּיתָּה וְקוֹד כִּיתָּתִי בִּלְבַד לְצוֹרֶךְ שְׁמִירַת כּוֹכָבִים, תַּלְבּוֹשׁוֹת וְנְקוּדּוֹת אוֹר.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                <p>
                  <strong>1. גִּישָׁה חִינָּמִית בְּרִישׁוּם (`free_registered`):</strong> הַשִּׁימּוּשׁ בְּאִיֵּי הַלְּמִידָה וּבָאִיִּים הָעוֹנָתִיִּים (חֲנֻכָּה תשפ״ז וְ-Winter Spark) פָּתוּחַ בְּחִינָּם לְמוֹרִים, הוֹרִים וְתַלְמִידִים רְשׁוּמִים.
                </p>
                <p>
                  <strong>2. שִׁימּוּשׁ חִינוּכִי וּמְכַבֵּד:</strong> הַתְּכָנִים, הַמּוֹדֶלִים הַתְּלַת־מֵמַדִּיִּים מִ-PDF וְלוּחַ הַמַּסָּע מְיוֹעָדִים לְשִׁימּוּשׁ פֵּדָגוֹגִי בַּכִּיתָּה וּבַבַּיִת.
                </p>
                <p>
                  <strong>3. זְכוּיוֹת יוֹצְרִים:</strong> כָּל הַזְּכוּיוֹת עַל מַעֲרֶכֶת &quot;אִיֵּי אוֹר&quot; וְתַבְנִיּוֹת הַמִּשְׂחָק שְׁמוּרוֹת לְ-DUPAMAN Studio.
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="btn-glow px-5 py-2.5 rounded-xl bg-sky-600 text-white font-extrabold text-xs"
              >
                הֵבַנְתִּי, תּוֹדָה!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
