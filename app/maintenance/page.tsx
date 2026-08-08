import { Construction, Clock3 } from "lucide-react"

import { getSettings } from "@/lib/database"
import { normalizeMaintenanceSettings } from "@/lib/maintenance"

function formatAvailableDate(value: string) {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date)
}

export default async function MaintenancePage() {
  const generalSettings = (await getSettings("general")) || {}
  const generalUaeSettings = (await getSettings("general_uae")) || {}
  const maintenanceSettings = normalizeMaintenanceSettings(await getSettings("maintenance"))

  const activeJurisdiction = generalSettings?.activeJurisdiction || "uk"
  const activeGeneralSettings = { ...generalSettings }

  if (activeJurisdiction === "uae") {
    for (const key of Object.keys(generalUaeSettings)) {
      if (
        generalUaeSettings[key] !== undefined &&
        generalUaeSettings[key] !== null &&
        generalUaeSettings[key] !== ""
      ) {
        activeGeneralSettings[key] = generalUaeSettings[key]
      }
    }
  }

  const siteName = activeGeneralSettings.siteName || "TEMPNOW"
  const availableDate = formatAvailableDate(maintenanceSettings.availableDate)

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.2),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.18),_transparent_30%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[32px] border border-white/10 bg-white/8 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-200">
              <Construction className="h-4 w-4" />
              Scheduled maintenance
            </div>

            <div className="mt-8 space-y-5">
              <p className="text-sm uppercase tracking-[0.3em] text-teal-200/80">{siteName}</p>
              <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {maintenanceSettings.title}
              </h1>
              <p
                className="max-w-2xl text-base leading-8 text-slate-200 sm:text-lg [&_a]:font-semibold [&_a]:text-teal-200 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-teal-100"
                dangerouslySetInnerHTML={{ __html: maintenanceSettings.message }}
              />
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <div className="flex items-center gap-3 text-teal-200">
                  <Clock3 className="h-5 w-5" />
                  <span className="text-sm font-medium uppercase tracking-[0.2em]">Expected availability</span>
                </div>
                <p className="mt-4 text-lg font-semibold text-white">
                  {availableDate || "We’ll reopen as soon as the update is complete."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                <div className="text-sm font-medium uppercase tracking-[0.2em] text-amber-200">Status</div>
                <p className="mt-4 text-lg font-semibold text-white">Public website temporarily unavailable</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  We are deploying improvements and verifying core systems before reopening access.
                </p>
              </div>
            </div>
          </section>

          <aside className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
            <div className="flex h-full flex-col justify-between gap-8">
              <div>
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-400 to-amber-400 text-slate-950 shadow-lg shadow-teal-500/20">
                  <Construction className="h-10 w-10" />
                </div>
                <h2 className="mt-8 text-2xl font-semibold text-white">We’re tuning the platform</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  The public experience is temporarily paused while we apply updates, verify content, and complete maintenance checks.
                </p>
              </div>

              <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-sm leading-7 text-slate-300">
                Need urgent help? Please contact the support team using the contact details previously provided by {siteName}.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}