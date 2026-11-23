import asyncio
import json
import math
import os
import subprocess
import wave
import numpy as np
import edge_tts

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

VOICE = "id-ID-GadisNeural"
RATE = "+16%"

SEGMENTS = [
    ("s1", "Masih cek pH dan kelembapan tanah secara manual?"),
    ("s2", "Tenang... kini ada Smart Soil Monitoring I O T!"),
    ("s3", "Pantau pH tanah, kelembapan D M S, dan suhu D S delapan belas B dua puluh secara real-time."),
    ("s4", "Mandiri dengan panel surya sepuluh watt dan jaringan empat G, langsung ke HP Anda."),
    ("s5", "Dari ribet, jadi serba otomatis."),
    ("s6", "Smart Soil Monitoring I O T. Pertanian cerdas di genggaman Anda."),
]

def get_duration(path):
    cmd = [
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        path,
    ]
    out = subprocess.check_output(cmd, text=True).strip()
    return float(out)

async def generate_tts():
    clips = []
    for key, text in SEGMENTS:
        mp3_path = os.path.join(AUDIO_DIR, f"vo_{key}.mp3")
        wav_path = os.path.join(AUDIO_DIR, f"vo_{key}.wav")
        comm = edge_tts.Communicate(text, voice=VOICE, rate=RATE)
        await comm.save(mp3_path)
        subprocess.run(
            ["ffmpeg", "-y", "-i", mp3_path, "-ar", "48000", "-ac", "1", wav_path],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True,
        )
        dur = get_duration(wav_path)
        clips.append({"key": key, "text": text, "wav": wav_path, "dur": dur})
        print(f"TTS {key}: {dur:.2f}s — {text}")
    return clips

def read_wav_mono(path):
    with wave.open(path, "rb") as wf:
        raw = wf.readframes(wf.getnframes())
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

def make_whoosh(sr, dur=0.45):
    n = int(sr * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    noise = np.random.randn(n).astype(np.float32)
    # Simple moving-average lowpass sweep for soft modern air whoosh
    env = np.sin(np.pi * t / dur) ** 1.6
    # Pitch-rising sine body blended with filtered noise
    freq = np.linspace(140.0, 520.0, n)
    phase = 2 * np.pi * np.cumsum(freq) / sr
    body = 0.25 * np.sin(phase)
    # Soften noise with 5-tap smoothing
    kernel = np.ones(9, dtype=np.float32) / 9.0
    soft_noise = np.convolve(noise, kernel, mode="same") * 0.22
    return (body + soft_noise) * env

def make_chime(sr, freq=587.33, dur=0.55):
    n = int(sr * dur)
    t = np.linspace(0, dur, n, endpoint=False)
    env = np.exp(-t * 6.5) * (1.0 - np.exp(-t * 140.0))
    sig = (
        0.55 * np.sin(2 * np.pi * freq * t)
        + 0.28 * np.sin(2 * np.pi * freq * 1.5 * t)
        + 0.14 * np.sin(2 * np.pi * freq * 2.0 * t)
    )
    return sig * env * 0.35

def synth_bgm(sr, total_dur):
    """Synthesize a clean, modern uplifting tech ambient pad + gentle pulse."""
    n = int(sr * total_dur)
    t = np.linspace(0, total_dur, n, endpoint=False)

    # Chord progression in D major / B minor (uplifting modern tech SaaS feel):
    # Bm7 -> Gmaj7 -> Dmaj7 -> Aadd9 (each 2.5 seconds, looping)
    chords = [
        [246.94, 293.66, 369.99, 440.00],  # Bm7
        [196.00, 246.94, 293.66, 369.99],  # Gmaj7
        [293.66, 369.99, 440.00, 554.37],  # Dmaj7
        [220.00, 277.18, 329.63, 493.88],  # Aadd9
    ]
    chord_dur = 2.6
    pad_l = np.zeros(n, dtype=np.float32)
    pad_r = np.zeros(n, dtype=np.float32)

    # Warm pad with subtle stereo detune
    for idx in range(int(math.ceil(total_dur / chord_dur))):
        start_s = int(idx * chord_dur * sr)
        end_s = min(n, int((idx + 1) * chord_dur * sr))
        if start_s >= n:
            break
        seg_t = t[start_s:end_s] - (idx * chord_dur)
        seg_len = end_s - start_s
        # Smooth crossfade envelope
        env = np.minimum(1.0, seg_t / 0.25) * np.minimum(1.0, (chord_dur - seg_t) / 0.25)
        env = np.clip(env, 0.0, 1.0)
        notes = chords[idx % len(chords)]
        chord_l = np.zeros(seg_len, dtype=np.float32)
        chord_r = np.zeros(seg_len, dtype=np.float32)
        for f in notes:
            chord_l += np.sin(2 * np.pi * (f * 0.9985) * seg_t) * 0.16
            chord_r += np.sin(2 * np.pi * (f * 1.0015) * seg_t) * 0.16
        # Warm sub-bass on root
        root = notes[0] / 2.0
        sub = np.sin(2 * np.pi * root * seg_t) * 0.22
        pad_l[start_s:end_s] += (chord_l + sub) * env
        pad_r[start_s:end_s] += (chord_r + sub) * env

    # Gentle modern pluck pulse (115 BPM -> 0.5217s per beat, 8th notes)
    step = 0.2608
    arp_notes = [587.33, 739.99, 880.00, 1108.73, 880.00, 739.99]
    num_steps = int(total_dur / step)
    for i in range(num_steps):
        st = int(i * step * sr)
        dur_p = min(0.24, total_dur - i * step)
        if dur_p <= 0.02:
            break
        ln = int(dur_p * sr)
        pt = np.linspace(0, dur_p, ln, endpoint=False)
        penv = np.exp(-pt * 14.0) * (1.0 - np.exp(-pt * 220.0))
        freq = arp_notes[i % len(arp_notes)]
        pluck = np.sin(2 * np.pi * freq * pt) * penv * 0.11
        # Alternate slight L/R pan
        pan = 0.62 if i % 2 == 0 else 0.38
        end = min(n, st + ln)
        pad_l[st:end] += pluck[: end - st] * pan
        pad_r[st:end] += pluck[: end - st] * (1.0 - pan)

    # Soft kick thump every 2 steps (quarter note)
    for i in range(0, num_steps, 2):
        st = int(i * step * sr)
        ln = min(int(0.14 * sr), n - st)
        if ln <= 10:
            break
        kt = np.linspace(0, ln / sr, ln, endpoint=False)
        kfreq = 115.0 * np.exp(-kt * 28.0) + 46.0
        kphase = 2 * np.pi * np.cumsum(kfreq) / sr
        kick = np.sin(kphase) * np.exp(-kt * 22.0) * 0.16
        pad_l[st:st + ln] += kick
        pad_r[st:st + ln] += kick

    # Fade in & fade out
    fade_in = np.minimum(1.0, t / 0.6)
    fade_out = np.minimum(1.0, (total_dur - t) / 1.4)
    master_env = np.clip(fade_in * fade_out, 0.0, 1.0)
    return pad_l * master_env, pad_r * master_env

def main():
    sr = 48000
    clips = asyncio.run(generate_tts())

    # Arrange timeline with clean breathing pauses between scenes
    pauses = {"s1": 0.55, "s2": 0.45, "s3": 0.45, "s4": 0.45, "s5": 0.45, "s6": 1.15}
    cursor = 0.35
    timeline = {}
    for c in clips:
        start_t = cursor
        end_t = start_t + c["dur"] + pauses[c["key"]]
        timeline[c["key"]] = {
            "start": round(start_t, 3),
            "vo_end": round(start_t + c["dur"], 3),
            "end": round(end_t, 3),
            "start_frame": int(round(start_t * 30)) + 1,
            "end_frame": int(round(end_t * 30)) + 1,
            "text": c["text"],
        }
        cursor = end_t

    total_dur = round(cursor, 2)
    total_frames = int(round(total_dur * 30))
    meta = {"total_dur": total_dur, "total_frames": total_frames, "fps": 30, "scenes": timeline}
    with open(os.path.join(AUDIO_DIR, "timings.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)
    print(f"Total duration: {total_dur:.2f}s ({total_frames} frames @ 30fps)")

    n = int(sr * total_dur)
    bgm_l, bgm_r = synth_bgm(sr, total_dur)
    vo_track = np.zeros(n, dtype=np.float32)
    sfx_l = np.zeros(n, dtype=np.float32)
    sfx_r = np.zeros(n, dtype=np.float32)
    duck_mask = np.ones(n, dtype=np.float32)

    whoosh = make_whoosh(sr, 0.42)
    chime_notes = [587.33, 659.25, 739.99, 880.00, 987.77, 1174.66]

    for idx, c in enumerate(clips):
        st_s = int(timeline[c["key"]]["start"] * sr)
        vo = read_wav_mono(c["wav"])
        end_s = min(n, st_s + len(vo))
        vo_track[st_s:end_s] += vo[: end_s - st_s] * 1.12

        # Smooth BGM ducking during speech
        d_start = max(0, st_s - int(0.12 * sr))
        d_end = min(n, end_s + int(0.15 * sr))
        duck_mask[d_start:d_end] = 0.42

        # Add bolder transition whoosh & bright chime on scene entry
        if idx > 0:
            w_st = max(0, st_s - int(0.28 * sr))
            w_end = min(n, w_st + len(whoosh))
            sfx_l[w_st:w_end] += whoosh[: w_end - w_st] * 0.78
            sfx_r[w_st:w_end] += whoosh[: w_end - w_st] * 0.78

        ch = make_chime(sr, chime_notes[idx % len(chime_notes)], 0.55)
        c_st = max(0, st_s - int(0.08 * sr))
        c_end = min(n, c_st + len(ch))
        sfx_l[c_st:c_end] += ch[: c_end - c_st] * 0.72
        sfx_r[c_st:c_end] += ch[: c_end - c_st] * 0.72

    # Smooth ducking envelope
    k_smooth = np.ones(int(0.12 * sr), dtype=np.float32) / int(0.12 * sr)
    duck_smooth = np.convolve(duck_mask, k_smooth, mode="same")

    mix_l = bgm_l * 0.30 * duck_smooth + vo_track + sfx_l
    mix_r = bgm_r * 0.30 * duck_smooth + vo_track + sfx_r

    # Gentle soft limiter
    peak = max(1e-5, float(np.max(np.abs(np.concatenate([mix_l, mix_r])))))
    if peak > 0.92:
        gain = 0.92 / peak
        mix_l *= gain
        mix_r *= gain

    stereo = np.stack([mix_l, mix_r], axis=1)
    pcm = np.clip(stereo * 32767.0, -32768, 32767).astype(np.int16)

    wav_out = os.path.join(AUDIO_DIR, "promo_audio.wav")
    with wave.open(wav_out, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())
    print("SAVED AUDIO:", wav_out)

if __name__ == "__main__":
    main()
