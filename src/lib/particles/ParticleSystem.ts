/**
 * Système de particules unifié pour Canvas 2D et CSS
 * Optimisé avec object pooling et RAF throttling
 */

export type ParticleType = 'sparkle' | 'trail' | 'explosion' | 'confetti' | 'smoke'

export interface ParticleConfig {
  x: number
  y: number
  vx?: number
  vy?: number
  lifetime?: number // ms
  color?: string
  size?: number
  gravity?: number
  friction?: number
  type?: ParticleType
}

export class Particle {
  x: number
  y: number
  vx: number
  vy: number
  lifetime: number
  maxLifetime: number
  color: string
  size: number
  gravity: number
  friction: number
  type: ParticleType
  rotation: number
  rotationSpeed: number
  active: boolean

  constructor(config: ParticleConfig) {
    this.x = config.x
    this.y = config.y
    this.vx = config.vx ?? (Math.random() - 0.5) * 6
    this.vy = config.vy ?? (Math.random() - 0.5) * 6
    this.maxLifetime = config.lifetime ?? 1000
    this.lifetime = this.maxLifetime
    this.color = config.color ?? '#FFFFFF'
    this.size = config.size ?? 4
    this.gravity = config.gravity ?? 0.1
    this.friction = config.friction ?? 0.98
    this.type = config.type ?? 'sparkle'
    this.rotation = Math.random() * Math.PI * 2
    this.rotationSpeed = (Math.random() - 0.5) * 0.2
    this.active = true
  }

  update(deltaTime: number): boolean {
    if (!this.active) return false

    // Physics
    this.vy += this.gravity
    this.vx *= this.friction
    this.vy *= this.friction

    this.x += this.vx
    this.y += this.vy

    this.rotation += this.rotationSpeed

    // Lifetime
    this.lifetime -= deltaTime
    if (this.lifetime <= 0) {
      this.active = false
      return false
    }

    return true
  }

  getAlpha(): number {
    return Math.max(0, this.lifetime / this.maxLifetime)
  }

  reset(config: ParticleConfig): void {
    this.x = config.x
    this.y = config.y
    this.vx = config.vx ?? (Math.random() - 0.5) * 6
    this.vy = config.vy ?? (Math.random() - 0.5) * 6
    this.maxLifetime = config.lifetime ?? 1000
    this.lifetime = this.maxLifetime
    this.color = config.color ?? '#FFFFFF'
    this.size = config.size ?? 4
    this.gravity = config.gravity ?? 0.1
    this.friction = config.friction ?? 0.98
    this.type = config.type ?? 'sparkle'
    this.rotation = Math.random() * Math.PI * 2
    this.rotationSpeed = (Math.random() - 0.5) * 0.2
    this.active = true
  }
}

export class ParticleManager {
  private particles: Particle[] = []
  private pool: Particle[] = []
  private maxPoolSize: number = 200
  private lastUpdate: number = 0

  constructor(maxPoolSize?: number) {
    if (maxPoolSize) {
      this.maxPoolSize = maxPoolSize
    }
  }

  /**
   * Émet des particules
   */
  emit(config: ParticleConfig, count: number = 1): void {
    for (let i = 0; i < count; i++) {
      let particle: Particle

      // Réutiliser depuis le pool si possible
      if (this.pool.length > 0) {
        particle = this.pool.pop()!
        particle.reset(config)
      } else {
        particle = new Particle(config)
      }

      this.particles.push(particle)
    }
  }

  /**
   * Émet une explosion radiale de particules
   */
  emitExplosion(x: number, y: number, count: number, options?: Partial<ParticleConfig>): void {
    const angleStep = (Math.PI * 2) / count

    for (let i = 0; i < count; i++) {
      const angle = angleStep * i + (Math.random() - 0.5) * 0.5
      const speed = 2 + Math.random() * 4

      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        ...options,
      })
    }
  }

  /**
   * Émet un trail de particules (pour suivre un objet)
   */
  emitTrail(x: number, y: number, options?: Partial<ParticleConfig>): void {
    this.emit({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      lifetime: 300,
      gravity: 0.05,
      ...options,
    })
  }

  /**
   * Met à jour toutes les particules
   */
  update(): void {
    const now = performance.now()
    const deltaTime = this.lastUpdate === 0 ? 16 : now - this.lastUpdate
    this.lastUpdate = now

    // Mise à jour et nettoyage
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]

      if (!particle.update(deltaTime)) {
        // Retour au pool
        this.particles.splice(i, 1)
        if (this.pool.length < this.maxPoolSize) {
          this.pool.push(particle)
        }
      }
    }
  }

  /**
   * Dessine toutes les particules sur un canvas
   */
  render(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(particle => {
      const alpha = particle.getAlpha()

      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation)
      ctx.globalAlpha = alpha

      switch (particle.type) {
        case 'sparkle':
          this.drawSparkle(ctx, particle)
          break
        case 'trail':
          this.drawTrail(ctx, particle)
          break
        case 'confetti':
          this.drawConfetti(ctx, particle)
          break
        case 'explosion':
        case 'smoke':
        default:
          this.drawCircle(ctx, particle)
          break
      }

      ctx.restore()
    })
  }

  private drawSparkle(ctx: CanvasRenderingContext2D, particle: Particle): void {
    // Étoile à 4 branches
    ctx.fillStyle = particle.color
    ctx.beginPath()
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2
      const x = Math.cos(angle) * particle.size
      const y = Math.sin(angle) * particle.size
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.fill()

    // Glow
    ctx.shadowColor = particle.color
    ctx.shadowBlur = particle.size * 2
    ctx.fill()
  }

  private drawTrail(ctx: CanvasRenderingContext2D, particle: Particle): void {
    // Cercle avec glow
    ctx.fillStyle = particle.color
    ctx.shadowColor = particle.color
    ctx.shadowBlur = particle.size
    ctx.beginPath()
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawConfetti(ctx: CanvasRenderingContext2D, particle: Particle): void {
    // Rectangle coloré
    ctx.fillStyle = particle.color
    ctx.fillRect(
      -particle.size / 2,
      -particle.size,
      particle.size,
      particle.size * 2
    )
  }

  private drawCircle(ctx: CanvasRenderingContext2D, particle: Particle): void {
    ctx.fillStyle = particle.color
    ctx.beginPath()
    ctx.arc(0, 0, particle.size, 0, Math.PI * 2)
    ctx.fill()
  }

  /**
   * Retourne les particules actives pour un rendu CSS
   */
  getActiveParticles(): Particle[] {
    return this.particles.filter(p => p.active)
  }

  /**
   * Nettoie toutes les particules
   */
  clear(): void {
    this.particles.forEach(p => {
      if (this.pool.length < this.maxPoolSize) {
        this.pool.push(p)
      }
    })
    this.particles = []
  }

  /**
   * Nombre de particules actives
   */
  get count(): number {
    return this.particles.length
  }
}
