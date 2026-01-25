#!/usr/bin/env python3
"""
Script de génération de sons synthétiques pour les mini-jeux
Génère des fichiers WAV simples pour tester le système audio
"""

import wave
import struct
import math
import os

# Configuration
SAMPLE_RATE = 44100
CHANNELS = 1
SAMPLE_WIDTH = 2  # 16-bit

def generate_tone(frequency, duration, volume=0.3, fade_out=0.1):
    """Génère un ton pur avec fade out"""
    samples = []
    num_samples = int(SAMPLE_RATE * duration)

    for i in range(num_samples):
        # Onde sinusoïdale
        t = i / SAMPLE_RATE
        sample = math.sin(2 * math.pi * frequency * t)

        # Fade out
        if duration - t < fade_out:
            fade = (duration - t) / fade_out
            sample *= fade

        # Amplitude
        sample *= volume * 32767
        samples.append(int(sample))

    return samples

def generate_sweep(start_freq, end_freq, duration, volume=0.3):
    """Génère un sweep de fréquence (montant ou descendant)"""
    samples = []
    num_samples = int(SAMPLE_RATE * duration)

    for i in range(num_samples):
        t = i / SAMPLE_RATE
        progress = t / duration

        # Interpolation linéaire de la fréquence
        freq = start_freq + (end_freq - start_freq) * progress
        sample = math.sin(2 * math.pi * freq * t)

        # Envelope
        envelope = 1.0
        if t < 0.01:  # Fade in
            envelope = t / 0.01
        elif duration - t < 0.1:  # Fade out
            envelope = (duration - t) / 0.1

        sample *= volume * envelope * 32767
        samples.append(int(sample))

    return samples

def generate_impact(duration, volume=0.5):
    """Génère un impact/percussion"""
    samples = []
    num_samples = int(SAMPLE_RATE * duration)

    for i in range(num_samples):
        t = i / SAMPLE_RATE

        # Mélange de fréquences basses avec decay rapide
        sample = 0
        for freq in [80, 120, 200]:
            sample += math.sin(2 * math.pi * freq * t) / 3

        # Decay exponentiel
        decay = math.exp(-t * 10)
        sample *= decay * volume * 32767
        samples.append(int(sample))

    return samples

def generate_click(duration=0.05, volume=0.3):
    """Génère un clic court"""
    samples = []
    num_samples = int(SAMPLE_RATE * duration)

    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Burst de haute fréquence
        sample = math.sin(2 * math.pi * 3000 * t)
        decay = math.exp(-t * 100)
        sample *= decay * volume * 32767
        samples.append(int(sample))

    return samples

def generate_success(duration=0.8, volume=0.4):
    """Génère un son de succès (arpège montant)"""
    samples = []
    num_samples = int(SAMPLE_RATE * duration)

    # Notes: C, E, G, C (arpège de Do majeur)
    notes = [523, 659, 784, 1047]
    note_duration = duration / len(notes)

    for note_idx, freq in enumerate(notes):
        note_start = int(note_idx * note_duration * SAMPLE_RATE)
        note_end = int((note_idx + 1) * note_duration * SAMPLE_RATE)

        for i in range(note_start, note_end):
            t = (i - note_start) / SAMPLE_RATE
            sample = math.sin(2 * math.pi * freq * t)

            # Envelope
            envelope = 1.0
            if t < 0.01:
                envelope = t / 0.01
            elif note_duration - t < 0.1:
                envelope = (note_duration - t) / 0.1

            sample *= volume * envelope * 32767

            if i < len(samples):
                samples[i] += int(sample)
            else:
                samples.append(int(sample))

    return samples

def save_wav(filename, samples):
    """Sauvegarde les samples en fichier WAV"""
    os.makedirs(os.path.dirname(filename), exist_ok=True)

    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(CHANNELS)
        wav_file.setsampwidth(SAMPLE_WIDTH)
        wav_file.setframerate(SAMPLE_RATE)

        for sample in samples:
            # Clamp
            sample = max(-32767, min(32767, sample))
            wav_file.writeframes(struct.pack('<h', sample))

    print(f"✓ Créé: {filename}")

def main():
    base_path = "public/sounds"

    print("🔊 Génération des sons synthétiques...")
    print()

    # === PACHINKO ===
    print("Pachinko:")
    save_wav(f"{base_path}/mini-games/pachinko/ball-drop.mp3",
             generate_sweep(800, 400, 0.5, 0.3))
    save_wav(f"{base_path}/mini-games/pachinko/peg-hit.mp3",
             generate_click(0.03, 0.2))
    save_wav(f"{base_path}/mini-games/pachinko/slot-win.mp3",
             generate_success(1.0, 0.4))
    print()

    # === WHEEL ===
    print("Roue de la Fortune:")
    save_wav(f"{base_path}/mini-games/wheel/spin-start.mp3",
             generate_sweep(200, 600, 0.4, 0.3))
    save_wav(f"{base_path}/mini-games/wheel/tick.mp3",
             generate_click(0.02, 0.15))
    save_wav(f"{base_path}/mini-games/wheel/win.mp3",
             generate_success(1.2, 0.5))
    print()

    # === DICE ===
    print("Dés:")
    save_wav(f"{base_path}/mini-games/dice/roll.mp3",
             generate_sweep(300, 500, 0.3, 0.3))
    save_wav(f"{base_path}/mini-games/dice/bounce.mp3",
             generate_impact(0.15, 0.3))
    save_wav(f"{base_path}/mini-games/dice/land.mp3",
             generate_impact(0.3, 0.4))
    print()

    # === SLOTS ===
    print("Machine à Sous:")
    # Spin (loop)
    spin_samples = []
    for _ in range(3):  # 3 secondes de loop
        spin_samples.extend(generate_tone(440, 0.05, 0.2))
        spin_samples.extend(generate_tone(880, 0.05, 0.2))
    save_wav(f"{base_path}/mini-games/slots/spin.mp3", spin_samples)

    save_wav(f"{base_path}/mini-games/slots/stop.mp3",
             generate_impact(0.2, 0.3))
    save_wav(f"{base_path}/mini-games/slots/jackpot.mp3",
             generate_success(2.0, 0.6))
    print()

    # === COIN ===
    print("Pièce:")
    save_wav(f"{base_path}/mini-games/coin/flip.mp3",
             generate_sweep(600, 800, 0.2, 0.3))

    # Spin (loop)
    spin_samples = []
    for i in range(20):  # 2 secondes
        freq = 800 + i * 10
        spin_samples.extend(generate_tone(freq, 0.1, 0.2, 0.05))
    save_wav(f"{base_path}/mini-games/coin/spin.mp3", spin_samples)

    save_wav(f"{base_path}/mini-games/coin/land.mp3",
             generate_impact(0.25, 0.4))
    print()

    # === SCRATCH ===
    print("Carte à Gratter:")
    # Scratch (loop de bruit)
    scratch_samples = []
    for _ in range(10):  # 1 seconde
        scratch_samples.extend(generate_sweep(2000, 3000, 0.1, 0.1))
    save_wav(f"{base_path}/mini-games/scratch/scratch.mp3", scratch_samples)

    save_wav(f"{base_path}/mini-games/scratch/reveal.mp3",
             generate_success(1.0, 0.5))
    print()

    # === UI ===
    print("Interface:")
    save_wav(f"{base_path}/ui/click.mp3",
             generate_click(0.05, 0.3))
    save_wav(f"{base_path}/ui/hover.mp3",
             generate_tone(600, 0.03, 0.15, 0.01))
    save_wav(f"{base_path}/ui/success.mp3",
             generate_success(0.5, 0.4))
    save_wav(f"{base_path}/ui/error.mp3",
             generate_sweep(400, 200, 0.3, 0.3))
    save_wav(f"{base_path}/ui/notification.mp3",
             generate_tone(800, 0.2, 0.3, 0.05))
    print()

    print("✅ Tous les sons ont été générés avec succès !")
    print(f"📂 Dossier: {base_path}/")
    print()
    print("Note: Ce sont des sons synthétiques basiques.")
    print("Pour des sons professionnels, remplacez-les depuis Freesound.org ou AudioJungle.")

if __name__ == "__main__":
    main()
