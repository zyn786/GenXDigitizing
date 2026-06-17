/**
 * Browser notification + sound utility.
 * Uses Web Audio API for a chime — no external audio files needed.
 * Falls back to sonner toast on mobile / when Notification API unavailable.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Simple two-tone chime
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.setValueAtTime(1100, now + 0.08);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1100, now + 0.09);
    osc2.frequency.setValueAtTime(1320, now + 0.17);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.35);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.4);
  } catch (err) {
    console.warn("[playNotificationSound] Audio unavailable:", err);
  }
}

let permissionRequested = false;

export async function requestNotificationPermission(userId?: string): Promise<boolean> {
  if (!("Notification" in window)) return false;

  // Warm up AudioContext from user gesture (required by browsers)
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch (err) { console.warn("[requestNotificationPermission] Audio resume failed:", err); }

  if (Notification.permission === "granted") {
    // Also subscribe to push if userId provided
    if (userId) {
      const { subscribeToPush } = await import("@/lib/push-notifications");
      subscribeToPush(userId).catch(() => {});
    }
    return true;
  }
  if (Notification.permission === "denied") return false;

  if (!permissionRequested) {
    permissionRequested = true;
    const result = await Notification.requestPermission();
    if (result === "granted" && userId) {
      const { subscribeToPush } = await import("@/lib/push-notifications");
      subscribeToPush(userId).catch(() => {});
    }
    return result === "granted";
  }

  return false;
}

let _Toast: any = null;
async function getToast() {
  if (!_Toast) {
    try {
      _Toast = (await import("sonner")).toast;
    } catch { /* sonner not available */ }
  }
  return _Toast;
}

export function showBrowserNotification(title: string, body: string, actionUrl?: string | null) {
  if (!("Notification" in window)) {
    console.warn("[showBrowserNotification] Notification API not available (mobile Safari / unsupported browser).");
    return false;
  }
  if (Notification.permission !== "granted") {
    console.warn("[showBrowserNotification] Notification permission not granted.");
    return false;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "genxdigitizing-notif",
      requireInteraction: false,
      // vibrate handled via navigator.vibrate in service worker
      silent: false,
    });

    if (actionUrl) {
      notif.onclick = () => {
        window.focus();
        window.location.href = actionUrl;
      };
    }

    // Auto-close after 5 seconds
    setTimeout(() => notif.close(), 5000);
    return true;
  } catch (err) {
    console.error("[showBrowserNotification] Failed:", err);
    return false;
  }
}

export function notify(title: string, body: string, actionUrl?: string | null) {
  playNotificationSound();
  const shown = showBrowserNotification(title, body, actionUrl);
  // Fallback: show sonner toast when browser notification unavailable
  if (!shown) {
    getToast().then((t) => {
      if (t) t(title, { description: body });
    });
  }
}

