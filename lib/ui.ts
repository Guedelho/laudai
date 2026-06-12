// Shared Tailwind class strings reused across the app.

export const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

export const textareaCls =
  "w-full border border-blue-200 rounded px-2 py-1 text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400";

// ─── Buttons ──────────────────────────────────────────────────────────────
// `focus-visible` keeps the ring out of mouse interactions but shows it for
// keyboard navigation — meets WCAG 2.4.7 without ugly click halos.
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500";

// Filled blue, used for the dominant action on a page or in a row.
export const btnPrimary = `inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

// Outlined gray, used for secondary actions. Label hides on `<sm`.
export const btnSecondary = `inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

// Outlined red for destructive actions, paired with the secondary visual weight
// so it never out-shouts the primary blue.
export const btnDanger = `inline-flex items-center gap-1.5 border border-red-200 text-red-600 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

// Gradient accent shared by every entry point into the assistant.
export const btnAssistant = `inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

// Bordered icon-only button (attach, mic) used in compact toolbars.
export const btnIcon = `rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;

// Full-width primary button for the auth/onboarding forms.
export const btnBlock = `w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${focusRing}`;
