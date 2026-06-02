// @ts-nocheck
/**
 * Browser notification + sound utility.
 * Uses Web Audio API for a chime — no external audio files needed.
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
  } catch {
    // Audio not available — silent fail
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
  } catch { /* audio not critical */ }

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

export function showBrowserNotification(title: string, body: string, actionUrl?: string | null) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const notif = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: "genxdigitizing-notif",
      requireInteraction: false,
    });

    if (actionUrl) {
      notif.onclick = () => {
        window.focus();
        window.location.href = actionUrl;
      };
    }

    // Auto-close after 5 seconds
    setTimeout(() => notif.close(), 5000);
  } catch {
    // Notification API failed — silent
  }
}

export function notify(title: string, body: string, actionUrl?: string | null) {
  playNotificationSound();
  showBrowserNotification(title, body, actionUrl);
}
