/**
 * Sound Manager for PONG-IT
 * Handles game sound effects and procedural music generation
 */

interface Note {
  frequency: number
  duration: number
  volume: number
}

type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle'

class SoundManager {
  private hitSound: HTMLAudioElement
  private scoreSound: HTMLAudioElement
  private loadSound: HTMLAudioElement
  private gameOverSound: HTMLAudioElement
  private introSound: HTMLAudioElement
  
  private audioContext: AudioContext | null
  private oscillators: OscillatorNode[]
  private gainNodes: GainNode[]
  private rhythmIntervals: NodeJS.Timeout[]
  private maxDurationTimeout: NodeJS.Timeout | null
  
  private defaultGenome: string
  
  public isGenomeAudioPlaying: boolean
  private initialized: boolean

  constructor() {
    this.hitSound = new Audio('/sounds/hit2.mp3')
    this.scoreSound = new Audio('/sounds/score2.mp3')
    this.loadSound = new Audio('/sounds/load2.mp3')
    this.gameOverSound = new Audio('/sounds/gameover3.mp3')
    this.introSound = new Audio('/sounds/intro2.mp3')
    
    this.audioContext = null
    this.oscillators = []
    this.gainNodes = []
    this.rhythmIntervals = []
    this.maxDurationTimeout = null
    
    this.defaultGenome = "aslkajd asklja lskj ask aslkj aldka lskdjaslkdj "
    
    this.isGenomeAudioPlaying = false
    this.initialized = false
  }

  init(): Promise<void> {
    console.log('Initializing SoundManager')
    
    if (this.initialized) {
      console.log('Already initialized')
      return Promise.resolve()
    }
    
    return new Promise((resolve) => {
      try {
        // Create audio context if it doesn't exist
        if (!this.audioContext) {
          console.log('Creating new AudioContext')
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
          this.audioContext = new AudioContextClass()
        }
        
        if (this.audioContext.state === 'suspended') {
          console.log('AudioContext suspended, attempting to resume')
          this.audioContext.resume().catch(e => {
            console.warn('Could not resume audio context:', e)
          })
        }
        
        console.log('Audio context created:', this.audioContext.state)
        
        // Load audio files silently without playing them
        console.log('Loading audio files')
        
        // This prevents the "play() request was interrupted" error
        const silentBuffer = this.audioContext.createBuffer(1, 1, 22050)
        const silentSource = this.audioContext.createBufferSource()
        silentSource.buffer = silentBuffer
        silentSource.connect(this.audioContext.destination)
        silentSource.start()
        
        this.initialized = true
        console.log('Sound Manager initialized successfully')
        resolve()
      } catch (e) {
        console.error('Failed to initialize audio context:', e)
        this.initialized = false // Mark as not initialized so we can try again
        resolve() // Resolve anyway to avoid blocking
      }
    })
  }

  ensureAudioContext(): AudioContext | null {
    console.log('Ensuring audio context')
    
    if (!this.audioContext) {
      try {
        console.log('Creating new AudioContext')
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        this.audioContext = new AudioContextClass()
      } catch (e) {
        console.error('Failed to create audio context:', e)
        return null
      }
    }
    
    if (this.audioContext.state === 'suspended') {
      console.log('AudioContext suspended, attempting to resume')
      this.audioContext.resume().catch(e => {
        console.error('Failed to resume audio context:', e)
      })
    }
    
    console.log('Audio context state:', this.audioContext.state)
    return this.audioContext
  }

  async playWithErrorHandling(playFunction: () => Promise<void>, fallbackMessage = ''): Promise<void> {
    try {
      if (!this.initialized) {
        await this.init()
      }
      
      // Ensure audio context is running
      this.ensureAudioContext()
      
      await playFunction()
    } catch (error) {
      console.warn(`Sound playback failed: ${fallbackMessage}`, error)
    }
  }

  startBackgroundMusic(): void {
    this.startGenomeAudio(this.defaultGenome)
  }

  startGenomeAudio(genome: string | null = null): Promise<void> | void {
    console.log('Starting genome audio, initialized:', this.initialized)
    if (!this.initialized) {
      console.log('Initializing sound manager before playing genome audio')
      return this.init().then(() => {
        this.isGenomeAudioPlaying = true
        return this.createRhythmicSound(genome || this.defaultGenome)
      })
    }
    this.isGenomeAudioPlaying = true
    return this.createRhythmicSound(genome || this.defaultGenome)
  }

  setMaxPlaybackDuration(durationMs = 30000, shouldAutoStop = false): void {
    // Stop any existing timeout
    if (this.maxDurationTimeout) {
      clearTimeout(this.maxDurationTimeout)
      this.maxDurationTimeout = null
    }
    
    // Only set the timeout if shouldAutoStop is true
    if (shouldAutoStop) {
      console.log(`Setting maximum playback duration: ${durationMs}ms`)
      this.maxDurationTimeout = setTimeout(() => {
        console.log(`Maximum playback duration (${durationMs}ms) reached, stopping sounds`)
        this.stopAll()
      }, durationMs)
    } else {
      console.log('Continuous playback enabled - no automatic stop')
    }
  }

  startSimpleGenomeAudio(genome: string | null = null): void {
    this.isGenomeAudioPlaying = true
    this.createRhythmicSound(genome || this.defaultGenome)
  }

  createRhythmicSound(genome: string): void {
    try {
      this.stopAll()
      
      console.log('AudioContext before ensuring:', this.audioContext ? this.audioContext.state : 'none')
      if (!this.ensureAudioContext()) {
        console.error('Failed to ensure audio context')
        return
      }
      console.log('AudioContext after ensuring:', this.audioContext!.state)
      
      this.isGenomeAudioPlaying = true
      
      console.log('Creating rhythmic sound with genome:', genome)
      
      const baseFreq = 80 + (Math.abs(this.hashCode(genome)) % 80)
      console.log('Base frequency:', baseFreq)
      
      const tempoFactor = 0.3 + (Math.abs(this.hashCode(genome.substring(0, 10))) % 0.2)
      const beatInterval = 300 * tempoFactor
      console.log('Beat interval:', beatInterval)
      
      const mainSequence = this.generateLongerSequence(genome, 16)
      const bassSequence = this.generateLongerSequence(genome.split('').reverse().join(''), 12)
      const accentSequence = this.generateLongerSequence(genome.substring(5) + genome.substring(0, 5), 10)
      
      console.log('Main sequence length:', mainSequence.length)
      console.log('Bass sequence length:', bassSequence.length)
      console.log('Accent sequence length:', accentSequence.length)
      
      const patternLength = this.lcm(
        this.lcm(mainSequence.length, bassSequence.length), 
        accentSequence.length
      )
      
      console.log('Total pattern length (beats):', patternLength)
      console.log('Pattern duration (seconds):', (patternLength * beatInterval) / 1000)
      
      this.setMaxPlaybackDuration(30000, false)
      
      let currentBeat = 0
      const mainRhythmInterval = setInterval(() => {
        if (currentBeat % 10 === 0) {
          console.log('Main rhythm beat:', currentBeat, 'isPlaying:', this.isGenomeAudioPlaying)
        }
        
        if (!this.isGenomeAudioPlaying) {
          console.log('Stopping main rhythm - isPlaying flag false')
          clearInterval(mainRhythmInterval)
          return
        }
        
        const mainIndex = currentBeat % mainSequence.length
        const mainNote = mainSequence[mainIndex]
        
        if (mainNote.volume > 0) {
          this.playNote(
            baseFreq * mainNote.frequency, 
            mainNote.duration * beatInterval * 0.85,
            mainNote.volume,
            'triangle'
          )
        }
        
        currentBeat++
      }, beatInterval)
      
      let bassBeat = 0
      const bassRhythmInterval = setInterval(() => {
        if (!this.isGenomeAudioPlaying) {
          clearInterval(bassRhythmInterval)
          return
        }
        
        const bassIndex = bassBeat % bassSequence.length
        const bassNote = bassSequence[bassIndex]
        
        if (bassNote.volume > 0) {
          this.playNote(
            (baseFreq * 0.75) * bassNote.frequency, 
            bassNote.duration * beatInterval * 0.9,
            bassNote.volume * 1.2,
            'sine'
          )
        }
        
        bassBeat++
      }, beatInterval * 1.5)
      
      let accentBeat = 0
      const accentRhythmInterval = setInterval(() => {
        if (!this.isGenomeAudioPlaying) {
          clearInterval(accentRhythmInterval)
          return
        }
        
        const accentIndex = accentBeat % accentSequence.length
        const accentNote = accentSequence[accentIndex]
        
        if (accentNote.volume > 0.15) {
          this.playNote(
            baseFreq * 1.5 * accentNote.frequency,
            accentNote.duration * beatInterval * 0.4,
            accentNote.volume * 0.9,
            'square'
          )
        }
        
        accentBeat++
      }, beatInterval * 2)
      
      this.rhythmIntervals.push(mainRhythmInterval, bassRhythmInterval, accentRhythmInterval)
      
      this.createBassDrone(baseFreq * 0.5)
      
      this.createRhythmicPercussion(beatInterval, genome, baseFreq)
      
      console.log('Faster rhythmic genome audio started successfully')
    } catch (error) {
      console.error('Error creating rhythmic sound:', error)
    }
  }

  generateLongerSequence(genome: string, length = 16): Note[] {
    const sequence: Note[] = []
    const possibleFrequencies = [0.5, 0.66, 0.75, 0.8, 1, 1.125, 1.25, 1.33, 1.5]
    
    let extendedGenome = genome
    while (extendedGenome.length < length * 3) {
      extendedGenome += genome
    }
    
    for (let i = 0; i < length * 2; i += 2) {
      if (i + 1 >= extendedGenome.length) break
      
      const char1 = extendedGenome.charCodeAt(i % extendedGenome.length)
      const char2 = extendedGenome.charCodeAt((i + 1) % extendedGenome.length)
      const char3 = extendedGenome.charCodeAt((i + 2) % extendedGenome.length)
      
      const freqIndex = char1 % possibleFrequencies.length
      const frequency = possibleFrequencies[freqIndex]
      
      const durationOptions = [0.5, 1, 1.5]
      const durIndex = char2 % durationOptions.length
      const duration = durationOptions[durIndex]
      
      const volume = (char3 % 100) < 15 ? 0 : (0.1 + ((char1 + char2) % 25) / 100)
      
      sequence.push({ frequency, duration, volume })
      
      if (sequence.length >= length) break
    }
    
    while (sequence.length < length) {
      sequence.push({ frequency: 1, duration: 1, volume: 0.2 })
    }
    
    return sequence
  }

  playNote(frequency: number, duration: number, volume: number, waveType: WaveType = 'triangle'): { osc: OscillatorNode; gainNode: GainNode } | null {
    try {
      if (!this.audioContext) {
        console.error('No audio context available for playNote')
        return null
      }
      
      const maxDuration = Math.min(3000, Math.max(100, duration))
      const safeVolume = Math.min(0.4, Math.max(0.05, volume))
      
      const osc = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      osc.type = waveType
      osc.frequency.value = frequency
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(safeVolume, this.audioContext.currentTime + 0.01)
      gainNode.gain.setValueAtTime(safeVolume, this.audioContext.currentTime + (maxDuration - 50) / 1000)
      gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + maxDuration / 1000)
      
      osc.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      const startTime = this.audioContext.currentTime
      const stopTime = startTime + (maxDuration + 50) / 1000
      
      osc.start(startTime)
      osc.stop(stopTime)
      
      osc.onended = () => {
        try {
          osc.disconnect()
          gainNode.disconnect()
        } catch (err) {
          // Already disconnected, ignore
        }
      }
      
      return { osc, gainNode }
    } catch (error) {
      console.error('Error playing note:', error)
      return null
    }
  }

  createBassDrone(frequency: number): void {
    try {
      if (!this.audioContext) return
      
      const osc = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()
      
      osc.type = 'sine'
      osc.frequency.value = frequency
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 1)
      gainNode.gain.setValueAtTime(0.06, this.audioContext.currentTime + 20)
      
      osc.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      osc.start()
      
      this.oscillators.push(osc)
      this.gainNodes.push(gainNode)
      
      console.log('Bass drone created at frequency:', frequency)
    } catch (error) {
      console.error('Error creating bass drone:', error)
    }
  }

  createRhythmicPercussion(beatInterval: number, genome: string, baseFreq: number): void {
    try {
      if (!this.audioContext) return
      
      const frequencies = [
        baseFreq * 1,
        baseFreq * 1.5,
        baseFreq * 2,
        baseFreq * 2.5
      ]
      
      const detuneValues: number[] = []
      for (let i = 0; i < 4; i++) {
        const startPos = i * 5
        const genomeSlice = genome.substring(startPos, startPos + 5)
        const detune = Math.abs(this.hashCode(genomeSlice)) % 20 - 10
        detuneValues.push(detune)
      }
      
      for (let i = 0; i < frequencies.length; i++) {
        const osc = this.audioContext.createOscillator()
        const gainNode = this.audioContext.createGain()
        
        osc.type = i % 2 === 0 ? 'sine' : 'triangle'
        osc.frequency.value = frequencies[i]
        osc.detune.value = detuneValues[i]
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.04 - (i * 0.005), this.audioContext.currentTime + 1)
        
        const lfo = this.audioContext.createOscillator()
        const lfoGain = this.audioContext.createGain()
        
        lfo.frequency.value = 0.05 + (i * 0.02)
        lfoGain.gain.value = 0.02
        
        lfo.connect(lfoGain)
        lfoGain.connect(gainNode.gain)
        
        osc.connect(gainNode)
        gainNode.connect(this.audioContext.destination)
        
        osc.start()
        lfo.start()
        
        this.oscillators.push(osc, lfo)
        this.gainNodes.push(gainNode, lfoGain)
      }
      
      console.log('Evolving pad created for continuous playback')
    } catch (error) {
      console.error('Error creating evolving pad:', error)
    }
  }

  lcm(a: number, b: number): number {
    return (a * b) / this.gcd(a, b)
  }

  gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b)
  }

  stopAll(): void {
    if (this.maxDurationTimeout) {
      clearTimeout(this.maxDurationTimeout)
      this.maxDurationTimeout = null
    }
    
    if (this.oscillators && this.oscillators.length > 0) {
      console.log('Stopping', this.oscillators.length, 'oscillators')
      
      const currentTime = this.audioContext ? this.audioContext.currentTime : 0
      
      for (let i = 0; i < this.oscillators.length; i++) {
        try {
          if (this.gainNodes && this.gainNodes[i]) {
            try {
              this.gainNodes[i].gain.setValueAtTime(this.gainNodes[i].gain.value, currentTime)
              this.gainNodes[i].gain.linearRampToValueAtTime(0, currentTime + 0.1)
            } catch (e) {
              console.warn('Error fading out gain node:', e)
            }
          }
          
          this.oscillators[i].stop(currentTime + 0.2)
          setTimeout(() => {
            try {
              this.oscillators[i].disconnect()
            } catch (e) {
              // Already disconnected
            }
          }, 250)
        } catch (e) {
          console.warn('Error stopping oscillator:', e)
        }
      }
      
      this.oscillators = []
      this.gainNodes = []
    }
    
    if (this.rhythmIntervals && this.rhythmIntervals.length > 0) {
      console.log('Clearing', this.rhythmIntervals.length, 'rhythm intervals')
      
      for (let i = 0; i < this.rhythmIntervals.length; i++) {
        clearInterval(this.rhythmIntervals[i])
      }
      
      this.rhythmIntervals = []
    }
    
    this.isGenomeAudioPlaying = false
    
    try {
      this.hitSound.pause()
      this.scoreSound.pause()
      this.loadSound.pause()
      this.gameOverSound.pause()
      this.introSound.pause()
    } catch (e) {
      console.warn('Error stopping sound effects:', e)
    }
  }

  stopGenomeAudio(): void {
    this.stopAll()
  }

  playHitSound(): Promise<void> {
    return this.playWithErrorHandling(
      () => {
        this.hitSound.currentTime = 0
        return this.hitSound.play()
          .catch(err => {
            console.warn('Hit sound playback error:', err)
            if (err.name === 'NotAllowedError') {
              console.info('Audio playback requires user interaction first')
            }
            throw err
          })
      },
      'Hit sound failed'
    )
  }

  playScoreSound(): Promise<void> {
    return this.playWithErrorHandling(
      () => {
        this.scoreSound.currentTime = 0
        return this.scoreSound.play()
          .catch(err => {
            console.warn('Score sound playback error:', err)
            throw err
          })
      },
      'Score sound failed'
    )
  }

  playLoadSound(): Promise<void> {
    return this.playWithErrorHandling(
      () => {
        this.loadSound.currentTime = 0
        return this.loadSound.play()
          .catch(err => {
            console.warn('Load sound playback error:', err)
            throw err
          })
      },
      'Load sound failed'
    )
  }

  playGameOverSound(): Promise<void> {
    return this.playWithErrorHandling(
      () => {
        this.gameOverSound.currentTime = 0
        return this.gameOverSound.play()
          .catch(err => {
            console.warn('Game over sound playback error:', err)
            throw err
          })
      },
      'Game over sound failed'
    )
  }

  playIntroSound(): Promise<void> {
    return this.playWithErrorHandling(
      () => {
        this.introSound.currentTime = 0
        return this.introSound.play()
          .catch(err => {
            console.warn('Intro sound playback error:', err)
            throw err
          })
      },
      'Intro sound failed'
    )
  }
  
  hashCode(str: string): number {
    if (!str || str.length === 0) return 0
    
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash
  }

  initializeOnUserInteraction(): Promise<void> {
    if (this.initialized) {
      console.log('Sound Manager already initialized')
      return Promise.resolve()
    }
    
    console.log('Initializing Sound Manager on user interaction')
    return this.init().then(() => {
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume()
      }
      
      try {
        const buffer = this.audioContext!.createBuffer(1, 1, 22050)
        const source = this.audioContext!.createBufferSource()
        source.buffer = buffer
        source.connect(this.audioContext!.destination)
        source.start(0)
        
        console.log('Audio context unlocked with buffer source')
        return Promise.resolve()
      } catch (e) {
        console.warn('Could not unlock audio context with buffer, falling back', e)
        return Promise.resolve()
      }
    })
  }
}

export default new SoundManager()


