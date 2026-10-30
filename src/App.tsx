import { type ChangeEvent, type FormEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleHelp, Clock3, Expand, Filter, Headphones, Music2, Pause, Play, Repeat, RotateCcw, Shrink, Sparkles, Volume2, VolumeX, X } from 'lucide-react'

type Note = { key: string; midi: number; beat: number; duration: number }
type Song = { id: string; title: string; artist: string; level: string; duration: string; tag: string; notes: Note[] }
type Page = 'home' | 'songs' | 'how'
type Profile = { name: string; age: string; gender: string; avatarData: string }
type SongProgress = { lastIndex: number; completed: boolean }
type NoteRange = { start: number; end: number }
type ViewTransitionDocument = Document & { startViewTransition?: (callback: () => void) => { finished: Promise<void> } }
const pitchNames = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
const keyLabel = (midi: number) => `${pitchNames[midi % 12]}${Math.floor(midi / 12) - 1}`
const numberFor = (midi: number) => ({ 0: 1, 2: 2, 4: 3, 5: 4, 7: 5, 9: 6, 11: 7 } as Record<number, number>)[midi % 12] ?? 1
const computerKeyByMidi: Record<number, string> = { 60: 'A', 61: 'W', 62: 'S', 63: 'E', 64: 'D', 65: 'F', 66: 'T', 67: 'G', 68: 'Y', 69: 'H', 70: 'U', 71: 'J', 72: 'K' }
const localDayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
function readLocalRecord<T>(key: string): Record<string, T> {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, T> : {}
  } catch { return {} }
}
function transitionState(update: () => void) {
  const transitionDocument = document as ViewTransitionDocument
  if (!transitionDocument.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update()
    return
  }
  try {
    document.documentElement.classList.add('view-transitions-enabled')
    transitionDocument.startViewTransition(() => flushSync(update))
  } catch {
    update()
  }
}
function countStreak(activity: Record<string, number>) {
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  if (!activity[localDayKey(cursor)]) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (activity[localDayKey(cursor)]) { streak += 1; cursor.setDate(cursor.getDate() - 1) }
  return streak
}

const makeNotes = (degrees: number[], duration = 0.72): Note[] => degrees.map((degree, beat) => {
  const midi = [60, 62, 64, 65, 67, 69, 71, 72][degree - 1]
  return { key: keyLabel(midi), midi, beat, duration }
})

const songs: Song[] = [
  { id: 'twinkle', title: 'Twinkle, Twinkle', artist: 'Traditional', level: 'Beginner', duration: '1 min', tag: 'The perfect first song', notes: [
    ...[60,60,67,67,69,69,67,65,65,64,64,62,62,60,67,67,65,65,64,64,62,67,67,65,65,64,64,62,60,60,67,67,69,69,67].map((midi, i) => ({ key: ['C4','C4','G4','G4','A4','A4','G4','F4','F4','E4','E4','D4','D4','C4','G4','G4','F4','F4','E4','E4','D4','G4','G4','F4','F4','E4','E4','D4','C4','C4','G4','G4','A4','A4','G4'][i], midi, beat: i, duration: 0.75 }))
  ] },
  { id: 'ode', title: 'Ode to Joy', artist: 'Ludwig van Beethoven', level: 'Beginner', duration: '2 min', tag: 'A familiar melody', notes: [
    ...[64,64,65,67,67,65,64,62,60,60,62,64,64,62,62,64,64,65,67,67,65,64,62,60,60,62,64,62,60,60].map((midi, i) => ({ key: `${['C','D','E','F','G','A','B'][midi-60]}4`, midi, beat: i, duration: 0.75 }))
  ] },
  { id: 'mary', title: 'Mary Had a Little Lamb', artist: 'Traditional', level: 'Beginner', duration: '1 min', tag: 'Just three notes', notes: [
    ...[64,62,60,62,64,64,64,62,62,62,64,67,67,64,62,60,62,64,64,64,64,62,62,64,62,60].map((midi, i) => ({ key: `${['C','D','E','F','G','A','B'][midi-60]}4`, midi, beat: i, duration: 0.7 }))
  ] },
  { id: 'hot-cross', title: 'Hot Cross Buns', artist: 'Traditional', level: 'First steps', duration: '1 min', tag: 'Three-note practice', notes: makeNotes([3,2,1,3,2,1,1,1,1,1,2,2,2,2,3,2,1]) },
  { id: 'frere', title: 'Frère Jacques', artist: 'Traditional', level: 'First steps', duration: '1 min', tag: 'A repeating melody', notes: makeNotes([1,2,3,1,1,2,3,1,3,4,5,3,4,5,5,6,5,4,3,1,5,6,5,4,3,1]) },
  { id: 'london', title: 'London Bridge', artist: 'Traditional', level: 'Finding your rhythm', duration: '1 min', tag: 'A little more movement', notes: makeNotes([5,6,5,4,3,4,5,2,3,4,3,4,5,5,6,5,4,3,4,5,2,5,1]) },
  { id: 'old-macdonald', title: 'Old MacDonald', artist: 'Traditional', level: 'Finding your rhythm', duration: '2 min', tag: 'Keep a steady beat', notes: makeNotes([1,1,1,5,6,6,5,3,3,2,2,1,5,5,1,1,1,1,1,1,1,5,5,1,1,1,1,1,1,1]) },
  { id: 'jingle', title: 'Jingle Bells', artist: 'Traditional', level: 'Ready for more', duration: '2 min', tag: 'A festive next step', notes: makeNotes([3,3,3,3,3,3,3,5,1,2,3,4,4,4,4,4,3,3,3,3,2,2,3,2,5]) },
  { id: 'saints', title: 'When the Saints Go Marching In', artist: 'Traditional', level: 'Ready for more', duration: '2 min', tag: 'A lively melody', notes: makeNotes([1,3,4,5,1,3,4,5,1,3,4,3,1,3,2,1,2,3,4,3,2,1,1,2,3,4,3,2,1]) },
  { id: 'amazing-grace', title: 'Amazing Grace', artist: 'Traditional', level: 'Ready for more', duration: '2 min', tag: 'Try a slower tempo', notes: makeNotes([1,4,1,4,6,5,4,2,1,4,1,4,6,5,6,5,4,2,1]) },
]

function PianoKey({ midi, active, onPress, wide = false }: { midi: number; active: boolean; onPress: (midi: number) => void; wide?: boolean }) {
  const black = [1, 3, 6, 8, 10].includes(midi % 12)
  const computerKey = computerKeyByMidi[midi]
  return <button aria-label={`Play ${keyLabel(midi)}${computerKey ? ` with ${computerKey}` : ''}`} onClick={() => onPress(midi)} className={`piano-key ${black ? 'black' : 'white'} ${active ? 'is-active' : ''} ${wide ? 'wide' : ''}`}>
    {!black && <span className="key-name">{keyLabel(midi).replace(/[0-9]/g, '')}</span>}
    {computerKey && <span className="computer-key" aria-hidden="true">{computerKey}</span>}
  </button>
}

function Staff({ song, currentIndex, sectionRange, sectionStart, onSelectNote }: { song: Song; currentIndex: number; sectionRange: NoteRange | null; sectionStart: number | null; onSelectNote: (index: number) => void }) {
  const visibleStart = Math.max(0, Math.floor(Math.max(currentIndex, 0) / 16) * 16)
  const notes = song.notes.slice(visibleStart, visibleStart + 16)
  const diatonicSteps = (midi: number) => {
    const letterStep = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6][midi % 12]
    return (Math.floor(midi / 12) - 5) * 7 + letterStep
  }
  const yFor = (midi: number) => 115 - diatonicSteps(midi) * 6.5
  return <div className="staff-wrap">
    <div className="staff-label">TREBLE CLEF <span>·</span> C MAJOR</div>
    <svg className="staff" viewBox="0 0 760 166" role="group" aria-label="Tap or focus a staff note to hear it and see its matching number">
      {[50, 63, 76, 89, 102].map(y => <line key={y} x1="68" x2="744" y1={y} y2={y} className="staff-line" />)}
      <text x="17" y="113" className="clef">𝄞</text>
      {notes.map((note, i) => {
        const x = 100 + i * 40
        const y = yFor(note.midi)
        const noteIndex = visibleStart + i
        const selected = noteIndex === currentIndex
        const inSection = sectionRange !== null && noteIndex >= sectionRange.start && noteIndex <= sectionRange.end
        const isSectionStart = noteIndex === sectionStart
        const noteOnLine = diatonicSteps(note.midi) % 2 === 0
        return <g key={`${visibleStart}-${i}`} role="button" tabIndex={0} aria-label={`Select note ${noteIndex + 1}: ${keyLabel(note.midi)}, number ${numberFor(note.midi)}`} onClick={() => onSelectNote(noteIndex)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectNote(noteIndex) } }} className={`staff-note ${selected ? 'selected' : ''} ${inSection ? 'in-section' : ''} ${isSectionStart ? 'section-start' : ''}`}>
          <rect x={x-16} y={y-16} width="32" height="32" fill="transparent" />
          {note.midi === 60 && <line x1={x-11} x2={x+11} y1={y} y2={y} className="ledger" />}
          <ellipse cx={x} cy={y} rx="8" ry="5.7" transform={`rotate(-18 ${x} ${y})`} className="note-head" />
          <line x1={x+7} x2={x+7} y1={y} y2={y-32} className="note-stem" />
          {!noteOnLine && <circle cx={x} cy={y} r="1" className="note-dot" />}
        </g>
      })}
      {[4,8,12].filter(i => i < notes.length).map(i => <line key={i} x1={100+i*40-19} x2={100+i*40-19} y1="50" y2="102" className="barline" />)}
    </svg>
    <div className="staff-caption"><span>Middle C</span><span>Each note above matches the number below</span><span>G4</span></div>
  </div>
}

function App() {
  const [page, setPage] = useState<Page>('home')
  const [songId, setSongId] = useState('twinkle')
  const [songProgress, setSongProgress] = useState<Record<string, SongProgress>>(() => readLocalRecord<SongProgress>('keypath-song-progress'))
  const [profileOpen, setProfileOpen] = useState(false)
  const [profile, setProfile] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('keypath-profile') || '{}')
      return { name: saved.name || '', age: saved.age || '', gender: saved.gender || '', avatarData: saved.avatarData || '' } as Profile
    } catch { return { name: '', age: '', gender: '', avatarData: '' } as Profile }
  })
  const [activity, setActivity] = useState<Record<string, number>>(() => readLocalRecord<number>('keypath-practice-days'))
  const [practiceMillis, setPracticeMillis] = useState<Record<string, number>>(() => readLocalRecord<number>('keypath-practice-millis'))
  const [welcomeQuestion, setWelcomeQuestion] = useState(() => localStorage.getItem('keypath-discovery-seen') !== 'true')
  const [discoverySource, setDiscoverySource] = useState('')
  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = songProgress.twinkle
    return saved ? saved.completed ? songs[0].notes.length - 1 : Math.max(-1, Math.min(saved.lastIndex, songs[0].notes.length - 1)) : -1
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [tempo, setTempo] = useState(82)
  const [soundOn, setSoundOn] = useState(true)
  const [activeMidi, setActiveMidi] = useState<number | null>(null)
  const [lessonStarted, setLessonStarted] = useState(false)
  const [showSheetBasics, setShowSheetBasics] = useState(false)
  const [playAlong, setPlayAlong] = useState(false)
  const [pianoFullscreen, setPianoFullscreen] = useState(false)
  const [answerFeedback, setAnswerFeedback] = useState('')
  const [sectionSelectionMode, setSectionSelectionMode] = useState(false)
  const [sectionStart, setSectionStart] = useState<number | null>(null)
  const [loopRange, setLoopRange] = useState<NoteRange | null>(null)
  const [isLoopingSection, setIsLoopingSection] = useState(false)
  const [levelFilter, setLevelFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')
  const [guidedStep, setGuidedStep] = useState<number | null>(null)
  const [guidedLessonDone, setGuidedLessonDone] = useState(() => localStorage.getItem('keypath-guided-lesson-done') === 'true')
  const [guidedPromptDismissed, setGuidedPromptDismissed] = useState(() => localStorage.getItem('keypath-guided-lesson-dismissed') === 'true')
  const navRef = useRef<HTMLElement | null>(null)
  const pianoFocusRef = useRef<HTMLDivElement | null>(null)
  const navIndicatorRef = useRef<HTMLSpanElement | null>(null)
  const audioRef = useRef<AudioContext | null>(null)
  const timerRef = useRef<number | undefined>(undefined)
  const tempoRef = useRef(tempo)
  const playingRef = useRef(false)
  const indexRef = useRef(currentIndex)
  const loopRangeRef = useRef<NoteRange | null>(loopRange)
  const loopActiveRef = useRef(false)
  const feedbackTimerRef = useRef<number | undefined>(undefined)
  const lastPracticeAtRef = useRef<number | null>(null)
  const song = songs.find(item => item.id === songId)!
  const nextNote = song.notes[Math.min(currentIndex + 1, song.notes.length - 1)]
  const songComplete = currentIndex >= song.notes.length - 1
  const practiceState = songComplete ? 'done' : currentIndex >= 0 ? 'in-progress' : 'not-started'
  const practiceStateLabel = songComplete ? 'Done' : currentIndex >= 0 ? 'In progress' : 'Not started'
  const completedSongCount = Object.values(songProgress).filter(progress => progress.completed).length
  const practiceMinutes = Math.floor(Object.values(practiceMillis).reduce((total, millis) => total + millis, 0) / 60000)
  const activeDaysCount = Object.keys(activity).filter(day => activity[day] > 0).length
  const filteredSongs = songs.filter(item => (levelFilter === 'all' || item.level === levelFilter) && (durationFilter === 'all' || item.duration === durationFilter))
  const nextSongRecommendation = [...songs.slice(songs.findIndex(item => item.id === songId) + 1), ...songs.slice(0, songs.findIndex(item => item.id === songId))].find(item => item.id !== songId && !songProgress[item.id]?.completed)
  const pianoMidis = useMemo(() => Array.from({ length: 25 }, (_, i) => 48 + i), [])
  const streakDays = useMemo(() => countStreak(activity), [activity])
  const activityCells = useMemo(() => {
    const today = new Date(); today.setHours(12, 0, 0, 0)
    const start = new Date(today); start.setDate(start.getDate() - 363 - start.getDay())
    return Array.from({ length: 371 }, (_, index) => {
      const date = new Date(start); date.setDate(start.getDate() + index)
      const key = localDayKey(date)
      const future = date > today
      const count = activity[key] || 0
      return { key, count, future, title: future ? '' : `${date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}: ${count} notes practised` }
    })
  }, [activity])
  const encouragement = streakDays >= 7 ? `A ${streakDays}-day streak! Your small practices are turning into real progress.` : streakDays >= 3 ? `${streakDays} days in a row. You’re building a lovely rhythm.` : streakDays > 0 ? 'You showed up today. One small practice keeps your rhythm going.' : 'Every piano player starts with one note. Yours is waiting today.'

  useEffect(() => {
    setIsPlaying(false)
    playingRef.current = false
    loopActiveRef.current = false
    setIsLoopingSection(false)
    setLoopRange(null)
    setSectionStart(null)
    setSectionSelectionMode(false)
    clearTimeout(timerRef.current)
  }, [songId])
  useEffect(() => { tempoRef.current = tempo; if (playingRef.current) scheduleNextTick() }, [tempo])
  useEffect(() => {
    indexRef.current = currentIndex
    if (currentIndex >= 0) saveSongProgress(songId, currentIndex)
  }, [currentIndex, songId])
  useEffect(() => { loopRangeRef.current = loopRange }, [loopRange])
  useEffect(() => {
    const syncFullscreen = () => setPianoFullscreen(document.fullscreenElement === pianoFocusRef.current)
    document.addEventListener('fullscreenchange', syncFullscreen)
    return () => document.removeEventListener('fullscreenchange', syncFullscreen)
  }, [])
  useEffect(() => () => { clearInterval(timerRef.current); audioRef.current?.close() }, [])
  useLayoutEffect(() => {
    const nav = navRef.current
    const indicator = navIndicatorRef.current
    if (!nav || !indicator) return
    const updateIndicator = () => {
      const activeButton = nav.querySelector<HTMLButtonElement>(`button[data-page="${page}"]`)
      if (!activeButton) return
      indicator.style.width = `${activeButton.offsetWidth}px`
      indicator.style.transform = `translateX(${activeButton.offsetLeft}px)`
    }
    updateIndicator()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateIndicator)
    observer?.observe(nav)
    nav.querySelectorAll('button').forEach(button => observer?.observe(button))
    window.addEventListener('resize', updateIndicator)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', updateIndicator)
    }
  }, [page])
  useEffect(() => {
    if (page !== 'songs' || profileOpen || welcomeQuestion) return
    const noteByComputerKey: Record<string, number> = { a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72 }
    function playComputerKey(event: KeyboardEvent) {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return
      const midi = noteByComputerKey[event.key.toLowerCase()]
      if (midi === undefined) return
      event.preventDefault()
      handlePracticeKey(midi)
    }
    window.addEventListener('keydown', playComputerKey)
    return () => window.removeEventListener('keydown', playComputerKey)
  }, [page, profileOpen, welcomeQuestion, soundOn, playAlong, guidedStep, currentIndex, loopRange])

  function playTone(midi: number, duration = 0.42) {
    const activityKey = localDayKey(new Date())
    setActivity(previous => {
      const next = { ...previous, [activityKey]: Math.min(99, (previous[activityKey] || 0) + 1) }
      localStorage.setItem('keypath-practice-days', JSON.stringify(next))
      return next
    })
    const now = Date.now()
    const lastPracticeAt = lastPracticeAtRef.current
    lastPracticeAtRef.current = now
    if (lastPracticeAt !== null && now - lastPracticeAt < 15000) {
      const elapsed = now - lastPracticeAt
      setPracticeMillis(previous => {
        const next = { ...previous, [activityKey]: (previous[activityKey] || 0) + elapsed }
        localStorage.setItem('keypath-practice-millis', JSON.stringify(next))
        return next
      })
    }
    if (!soundOn) return
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const context = audioRef.current ?? (audioRef.current = new AudioContextClass())
    if (context.state === 'suspended') void context.resume()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.value = 440 * Math.pow(2, (midi - 69) / 12)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)
    oscillator.connect(gain); gain.connect(context.destination)
    oscillator.start(); oscillator.stop(context.currentTime + duration + 0.04)
    setActiveMidi(midi)
    window.setTimeout(() => setActiveMidi(value => value === midi ? null : value), duration * 1000)
  }

  function togglePianoFullscreen() {
    const target = pianoFocusRef.current
    if (!target) return
    if (document.fullscreenElement === target) {
      void document.exitFullscreen()
      return
    }
    if (pianoFullscreen && !document.fullscreenElement) {
      setPianoFullscreen(false)
      return
    }
    if (target.requestFullscreen) {
      void target.requestFullscreen().catch(() => setPianoFullscreen(true))
    } else setPianoFullscreen(value => !value)
  }

  function saveSongProgress(progressSongId: string, index: number) {
    const progressSong = songs.find(item => item.id === progressSongId)
    if (!progressSong) return
    setSongProgress(previous => {
      const next = {
        ...previous,
        [progressSongId]: {
          lastIndex: index,
          completed: Boolean(previous[progressSongId]?.completed || index >= progressSong.notes.length - 1),
        },
      }
      localStorage.setItem('keypath-song-progress', JSON.stringify(next))
      return next
    })
  }

  function showAnswerFeedback(message: string) {
    setAnswerFeedback(message)
    clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = window.setTimeout(() => setAnswerFeedback(''), 1100)
  }

  function handlePracticeKey(midi: number) {
    if (guidedStep === 2) {
      playTone(midi)
      const expected = song.notes[0].midi
      if (midi === expected) {
        setCurrentIndex(0)
        indexRef.current = 0
        setGuidedStep(3)
        showAnswerFeedback(`You found ${keyLabel(expected)}.`)
      } else showAnswerFeedback(`Try ${keyLabel(expected)} — the first note.`)
      return
    }
    if (!playAlong) {
      playTone(midi)
      return
    }
    const expectedIndex = loopRange
      ? currentIndex >= loopRange.end ? loopRange.start : currentIndex < loopRange.start ? loopRange.start : currentIndex + 1
      : currentIndex >= song.notes.length - 1 ? 0 : Math.max(0, currentIndex + 1)
    const expectedNote = song.notes[expectedIndex]
    playTone(midi)
    if (midi === expectedNote.midi) {
      setCurrentIndex(expectedIndex)
      indexRef.current = expectedIndex
      showAnswerFeedback(`Correct · ${numberFor(midi)} · ${keyLabel(midi)}`)
    } else showAnswerFeedback(`Try ${numberFor(expectedNote.midi)} · ${keyLabel(expectedNote.midi)}`)
  }

  function playNext() {
    playingRef.current = false
    loopActiveRef.current = false
    setIsPlaying(false)
    setIsLoopingSection(false)
    clearTimeout(timerRef.current)
    const index = loopRange && isLoopingSection && currentIndex >= loopRange.end ? loopRange.start : Math.min(currentIndex + 1, song.notes.length - 1)
    if (currentIndex >= song.notes.length - 1) return
    setCurrentIndex(index)
    indexRef.current = index
    playTone(song.notes[index].midi, Math.max(0.25, (60 / tempo) * 0.72))
  }
  function playPrevious() {
    playingRef.current = false
    loopActiveRef.current = false
    setIsPlaying(false)
    setIsLoopingSection(false)
    clearTimeout(timerRef.current)
    const index = Math.max(-1, currentIndex - 1)
    setCurrentIndex(index)
    indexRef.current = index
    if (index >= 0) playTone(song.notes[index].midi, Math.max(0.25, (60 / tempo) * 0.72))
  }
  function scheduleNextTick() {
    clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      if (!playingRef.current) return
      let index = indexRef.current + 1
      const activeRange = loopRangeRef.current
      if (loopActiveRef.current && activeRange && index > activeRange.end) index = activeRange.start
      if (index >= song.notes.length) {
        playingRef.current = false
        setIsPlaying(false)
        return
      }
      setCurrentIndex(index)
      indexRef.current = index
      playTone(song.notes[index].midi, Math.max(0.25, (60 / tempoRef.current) * 0.72))
      scheduleNextTick()
    }, (60 / tempoRef.current) * 1000)
  }
  function togglePlayback() {
    if (playingRef.current) { playingRef.current = false; loopActiveRef.current = false; setIsLoopingSection(false); setIsPlaying(false); clearTimeout(timerRef.current); return }
    loopActiveRef.current = false
    setIsLoopingSection(false)
    const startAt = currentIndex >= song.notes.length - 1 ? 0 : currentIndex + 1
    if (startAt === 0) { setCurrentIndex(-1); indexRef.current = -1 }
    playingRef.current = true
    setIsPlaying(true)
    const index = startAt
    setCurrentIndex(index)
    indexRef.current = index
    playTone(song.notes[index].midi, Math.max(0.25, (60 / tempoRef.current) * 0.72))
    scheduleNextTick()
  }
  function toggleSectionLoop() {
    if (!loopRange) return
    if (loopActiveRef.current) {
      loopActiveRef.current = false
      playingRef.current = false
      setIsLoopingSection(false)
      setIsPlaying(false)
      clearTimeout(timerRef.current)
      return
    }
    loopActiveRef.current = true
    playingRef.current = true
    setIsLoopingSection(true)
    setIsPlaying(true)
    const index = loopRange.start
    setCurrentIndex(index)
    indexRef.current = index
    playTone(song.notes[index].midi, Math.max(0.25, (60 / tempoRef.current) * 0.72))
    scheduleNextTick()
  }
  function reset() {
    playingRef.current = false
    loopActiveRef.current = false
    setIsPlaying(false)
    setIsLoopingSection(false)
    clearTimeout(timerRef.current)
    setCurrentIndex(-1)
    indexRef.current = -1
    saveSongProgress(songId, -1)
    lastPracticeAtRef.current = null
  }
  function chooseNote(index: number) {
    playingRef.current = false
    loopActiveRef.current = false
    setIsPlaying(false)
    setIsLoopingSection(false)
    clearTimeout(timerRef.current)
    setCurrentIndex(index)
    indexRef.current = index
    playTone(song.notes[index].midi)
    window.requestAnimationFrame(() => document.querySelector(`[data-note-index="${index}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }))
  }
  function selectNote(index: number) {
    if (!sectionSelectionMode) {
      chooseNote(index)
      return
    }
    if (sectionStart === null) {
      setSectionStart(index)
      setAnswerFeedback(`Start set at note ${index + 1}. Choose an end note.`)
      return
    }
    const range = { start: Math.min(sectionStart, index), end: Math.max(sectionStart, index) }
    setLoopRange(range)
    loopRangeRef.current = range
    setSectionStart(null)
    setSectionSelectionMode(false)
    showAnswerFeedback(`Section selected · notes ${range.start + 1}–${range.end + 1}`)
  }
  function loadSong(nextSongId: string) {
    const nextSong = songs.find(item => item.id === nextSongId)
    if (!nextSong || nextSongId === songId) return
    const saved = songProgress[nextSongId]
    const restoredIndex = saved ? saved.completed ? nextSong.notes.length - 1 : Math.max(-1, Math.min(saved.lastIndex, nextSong.notes.length - 1)) : -1
    setSongId(nextSongId)
    setLessonStarted(false)
    setGuidedStep(null)
    setAnswerFeedback('')
    setCurrentIndex(restoredIndex)
    setIsPlaying(false)
    playingRef.current = false
    indexRef.current = restoredIndex
    loopActiveRef.current = false
    clearTimeout(timerRef.current)
  }
  function startGuidedLesson() {
    navigate('songs', 'twinkle')
    setGuidedPromptDismissed(true)
    localStorage.setItem('keypath-guided-lesson-dismissed', 'true')
    setGuidedStep(0)
  }
  function advanceGuidedLesson() {
    if (guidedStep === 3) {
      localStorage.setItem('keypath-guided-lesson-done', 'true')
      setGuidedLessonDone(true)
      setGuidedStep(null)
      return
    }
    setGuidedStep(step => step === null ? 0 : Math.min(step + 1, 2))
  }
  function dismissGuidedPrompt() {
    setGuidedPromptDismissed(true)
    localStorage.setItem('keypath-guided-lesson-dismissed', 'true')
  }
  function togglePlayAlong() {
    const next = !playAlong
    setPlayAlong(next)
    if (next && currentIndex >= song.notes.length - 1) {
      setCurrentIndex(-1)
      indexRef.current = -1
    }
    const expectedIndex = currentIndex >= song.notes.length - 1 ? 0 : Math.max(0, currentIndex + 1)
    setAnswerFeedback(next ? `Play the highlighted note · ${keyLabel(song.notes[expectedIndex].midi)}` : '')
    if (next && playingRef.current) {
      playingRef.current = false
      loopActiveRef.current = false
      setIsLoopingSection(false)
      setIsPlaying(false)
      clearTimeout(timerRef.current)
    }
  }
  function toggleSectionSelection() {
    setSectionSelectionMode(value => !value)
    setSectionStart(null)
  }
  function clearSection() {
    loopActiveRef.current = false
    setIsLoopingSection(false)
    setIsPlaying(false)
    playingRef.current = false
    clearTimeout(timerRef.current)
    setLoopRange(null)
    loopRangeRef.current = null
    setSectionStart(null)
  }
  function selectSong(nextSongId: string) {
    loadSong(nextSongId)
  }
  function navigate(nextPage: Page, nextSongId?: string) {
    const update = () => {
      if (nextSongId && nextSongId !== songId) loadSong(nextSongId)
      setPage(nextPage)
    }
    if (nextPage === page && (!nextSongId || nextSongId === songId)) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    transitionState(update)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    localStorage.setItem('keypath-profile', JSON.stringify(profile))
    setProfileOpen(false)
  }
  function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 160
        const context = canvas.getContext('2d')
        if (!context) return
        const side = Math.min(image.width, image.height)
        context.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 160, 160)
        setProfile(value => ({ ...value, avatarData: canvas.toDataURL('image/jpeg', 0.8) }))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }
  function finishWelcome(skip = false) {
    if (!skip && discoverySource) localStorage.setItem('keypath-discovery-source', discoverySource)
    localStorage.setItem('keypath-discovery-seen', 'true')
    setWelcomeQuestion(false)
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to learning area</a>
    <header className="topbar">
      <button className="brand" onClick={() => navigate('home')} aria-label="Keypath home"><span className="brand-mark"><Music2 size={19} strokeWidth={2.2} /></span><span>keypath<span className="brand-period">.</span></span></button>
      <nav className="main-nav" ref={navRef}><button data-page="home" aria-current={page === 'home' ? 'page' : undefined} className={page === 'home' ? 'active' : ''} onClick={() => navigate('home')}>Home</button><button data-page="songs" aria-current={page === 'songs' ? 'page' : undefined} className={page === 'songs' ? 'active' : ''} onClick={() => navigate('songs')}>Song library</button><button data-page="how" aria-current={page === 'how' ? 'page' : undefined} className={page === 'how' ? 'active' : ''} onClick={() => navigate('how')}>How it works</button><span className="nav-indicator" ref={navIndicatorRef} aria-hidden="true" /></nav>
      <div className="top-actions"><button className="streak" onClick={() => setProfileOpen(true)} aria-label={`Open your profile and ${streakDays} day practice streak`}><Sparkles size={14} /> <b>{streakDays}</b> day streak</button><button className="avatar" onClick={() => setProfileOpen(true)} aria-label="Edit your profile">{profile.avatarData ? <img src={profile.avatarData} alt=""/> : profile.name ? profile.name[0].toUpperCase() : 'A'}</button></div>
    </header>

    <main id="main-content" tabIndex={-1}>
      <div className={`page-content page-${page}`} key={page}>
      {page === 'home' && <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> YOUR FIRST NOTES START HERE</div>
          <h1>A first step from<br />curious to <em>confident.</em></h1>
          <p className="hero-text">Sheet music can feel like a wall of symbols when you’re starting out. Keypath connects each note to a simple number and piano key, so you can play songs while learning how music works.</p>
          <button onClick={() => navigate('songs')} className="hero-link">Explore the song library <ArrowRight size={16} /></button>
          <button onClick={() => navigate('how')} className="hero-secondary">See how learning works</button>
        </div>
        <div className="hero-art" aria-label="Illustration of a piano keyboard and musical notes">
          <div className="art-sun" /><div className="art-staff"><span>♪</span><span>♫</span><span>♪</span><span>♩</span></div>
          <div className="art-pill pill-top"><span className="pill-dot" /> C · 1</div><div className="art-pill pill-side">a little progress, every day <Sparkles size={12} /></div>
          <div className="art-piano"><div className="art-keys">{Array.from({ length: 12 }, (_, i) => <span key={i} className={i % 7 === 1 || i % 7 === 3 || i % 7 === 6 ? 'mini-black' : ''} />)}</div></div>
          <div className="art-note note-a">1</div><div className="art-note note-b">5</div><div className="art-note note-c">6</div>
          <div className="art-spark">✳</div>
        </div>
      </section>}

      {page === 'home' && <section className="home-details"><div className="home-section-heading"><span className="section-kicker">A DIFFERENT WAY TO BEGIN</span><h2>Make the first note feel possible.</h2><p>No experience needed. Follow a clear path from seeing a number to finding that note on the piano.</p></div><div className="home-feature-grid"><article><span className="feature-index">01</span><div className="feature-icon">1</div><h3>Numbers make a first step</h3><p>Follow a simple number sequence while you learn which piano keys make each sound.</p></article><article><span className="feature-index">02</span><div className="feature-icon staff-feature">𝄞</div><h3>Sheet music starts to click</h3><p>See the same melody on a staff, so you can grow into reading traditional music at your pace.</p></article><article><span className="feature-index">03</span><div className="feature-icon keys-feature">C <span>→</span> ♫</div><h3>Practice with instant feedback</h3><p>Hear notes, adjust the tempo, and jump to any part you want to try again.</p></article></div><div className="home-lower"><div className="home-song-preview"><div><span className="section-kicker">PICK UP WHERE YOU ARE</span><h2>Start with a song you know.</h2><p>Short, familiar melodies help you focus on learning instead of memorizing.</p></div><div className="preview-songs">{songs.slice(0,6).map((item,i)=><button key={item.id} className={item.id === songId ? 'selected' : ''} onClick={()=>navigate('songs', item.id)}><span className="preview-number">0{i+1}</span><span><b>{item.title}</b><small>{item.level}</small></span><ArrowRight size={14}/></button>)}</div></div></div></section>}

      {page === 'songs' && <section className="lesson-section" id="songs">
        <div className="section-heading"><div><span className="section-kicker">YOUR PRACTICE SPACE</span><h2>Let’s play something.</h2></div><span className="session-note"><span className="live-dot" /> Your first session <span>·</span> no pressure, just play</span></div>
        <div className="lesson-card">
          <aside className="song-sidebar">
            <div className="sidebar-title"><span>SONG LIBRARY</span></div>
            <div className="song-filters"><Filter size={14} aria-hidden="true" /><label><span className="visually-hidden">Filter by level</span><select aria-label="Filter by difficulty" value={levelFilter} onChange={event => setLevelFilter(event.target.value)}><option value="all">All levels</option>{Array.from(new Set(songs.map(item => item.level))).map(level => <option key={level} value={level}>{level}</option>)}</select></label><label><span className="visually-hidden">Filter by length</span><select aria-label="Filter by song length" value={durationFilter} onChange={event => setDurationFilter(event.target.value)}><option value="all">Any length</option><option value="1 min">About 1 min</option><option value="2 min">About 2 min</option></select></label>{(levelFilter !== 'all' || durationFilter !== 'all') && <button className="clear-filters" onClick={() => { setLevelFilter('all'); setDurationFilter('all') }}>Clear</button>}</div>
            <div className="song-list">
              {filteredSongs.map(item => {
                const progress = songProgress[item.id]
                const stateLabel = progress?.completed ? 'Done' : progress && progress.lastIndex >= 0 ? 'In progress' : 'New'
                return <button key={item.id} onClick={() => selectSong(item.id)} aria-current={item.id === songId ? 'true' : undefined} className={`song-item ${item.id === songId ? 'selected' : ''}`}>
                <span className="song-icon"><Music2 size={17} /></span><span className="song-meta"><b>{item.title}</b><small>{item.level} · {item.duration}</small><small className={`song-progress-label ${progress?.completed ? 'is-done' : progress && progress.lastIndex >= 0 ? 'is-progress' : ''}`}>{stateLabel}</small></span>{item.id === songId && <span className="song-current"><Check size={12} /></span>}
              </button>})}
              {filteredSongs.length === 0 && <p className="empty-song-filter">No songs match these filters.</p>}
            </div>
            <div className="sidebar-bottom"><div className="side-progress-top"><span>YOUR FIRST SONG</span><span>{currentIndex < 0 ? 0 : Math.round(((currentIndex + 1) / song.notes.length) * 100)}%</span></div><div className="progress-track"><span style={{ width: `${currentIndex < 0 ? 0 : ((currentIndex + 1) / song.notes.length) * 100}%` }} /></div><div className="side-song-name">{song.title}</div><div className="side-song-details"><span>{song.level}</span><span>·</span><span>{song.duration}</span></div></div>
          </aside>
          <div className="lesson-main">
            <div className="lesson-topline"><div className="song-title-block"><div className="song-title-row"><h3>{song.title}</h3><span className="level-tag">{song.level}</span></div><p>{song.tag} <span>·</span> {song.artist}</p></div><div className="lesson-actions"><div className={`practice-status is-${practiceState}`} role="status" aria-live="polite" aria-atomic="true"><span className="status-indicator">{songComplete ? <Check size={11} strokeWidth={2.6} /> : <span />}</span><span>{practiceStateLabel}</span></div><button className="sound-toggle" onClick={() => setSoundOn(value => !value)} aria-label={soundOn ? 'Mute sound' : 'Turn sound on'}>{soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}</button></div></div>
            {guidedStep !== null && <aside className="guided-lesson" aria-live="polite"><div className="guided-lesson-heading"><span><BookOpen size={16} /> Guided first lesson</span><small>{guidedStep < 3 ? `Step ${guidedStep + 1} of 3` : 'Complete'}</small></div><h4>{guidedStep === 0 ? 'Numbers give you a simple starting point.' : guidedStep === 1 ? 'Now connect the number to the piano.' : guidedStep === 2 ? 'Play middle C.' : 'You played your first note.'}</h4><p>{guidedStep === 0 ? 'This song is in C major. The number 1 represents C, so the first note and the key both point to the same sound.' : guidedStep === 1 ? 'Middle C is C4. On the on-screen piano, look for the C key marked A.' : guidedStep === 2 ? 'Press A on your computer keyboard or tap C4 on the piano.' : 'That is how numbers, sheet music, and piano keys connect. You’re ready to keep practising.'}</p><div className="guided-lesson-actions"><button onClick={advanceGuidedLesson}>{guidedStep === 2 ? 'Skip note' : guidedStep === 3 ? 'Finish lesson' : 'Continue'} <ArrowRight size={14} /></button><button onClick={() => setGuidedStep(null)}>Close guide</button></div></aside>}
            {guidedStep === null && !guidedPromptDismissed && !guidedLessonDone && <aside className="guided-prompt"><div><b>New to piano?</b><span>Try a short guided lesson to connect one number, staff note, and piano key.</span></div><button onClick={startGuidedLesson}>Start guide <ArrowRight size={14} /></button><button className="guided-dismiss" onClick={dismissGuidedPrompt} aria-label="Dismiss guided lesson suggestion"><X size={15} /></button></aside>}
            {guidedStep === null && guidedLessonDone && <button className="repeat-guide-link" onClick={startGuidedLesson}>Repeat the guided first lesson <ArrowRight size={13} /></button>}
            <div className={`lesson-focus ${pianoFullscreen ? 'is-fullscreen' : ''}`} ref={pianoFocusRef}>
              <div className="piano-focus-top"><div className="piano-focus-song"><span>PIANO PRACTICE</span><b>{song.title}</b></div><button className="fullscreen-close" onClick={togglePianoFullscreen} aria-label="Exit full screen piano" title="Exit full screen"><Shrink size={17} /><span>Exit full screen</span></button></div>
            <div className="score-panel"><div className="score-heading"><div><span className="score-icon"><Music2 size={14} /></span><b>THE MUSIC</b><span className="score-separator">/</span><small>Each note has a number</small></div><button className="notation-help" onClick={() => setShowSheetBasics(value => !value)} aria-expanded={showSheetBasics}><CircleHelp size={14} /> {showSheetBasics ? 'Hide basics' : 'Learn sheet music'}</button></div>
              {showSheetBasics && <div className="sheet-basics"><div className="basics-heading"><div><span className="basics-icon"><Sparkles size={15} /></span><div><b>Sheet music, made simple</b><small>Three things to know before you play</small></div></div><button onClick={() => setShowSheetBasics(false)} aria-label="Close sheet music basics"><X size={15} /></button></div><div className="basics-grid"><article><span className="basics-number">01</span><b>The five lines</b><p>Read from the bottom up. In treble clef, the lines spell <strong>E G B D F</strong> (“Every Good Bird Does Fly”). The spaces spell F A C E.</p></article><article><span className="basics-number">02</span><b>Find middle C</b><p>Middle C sits just below the staff on its own small ledger line. Each step up moves to the next letter: C, D, E, F, G, A, B.</p></article><article><span className="basics-number">03</span><b>Match notes to numbers</b><p>These songs are in C major: <strong>C=1, D=2, E=3, F=4, G=5, A=6, B=7.</strong> The number under each note shows which piano key to play.</p></article></div></div>}
              <Staff song={song} currentIndex={currentIndex} sectionRange={loopRange} sectionStart={sectionStart} onSelectNote={selectNote} />
              <div className="number-row"><div className="number-label"><b>SONG NOTES</b><span>{sectionSelectionMode ? sectionStart === null ? 'choose start' : 'choose end' : 'tap to jump'}</span></div><div className="number-notes">{song.notes.map((note, i) => <button key={i} data-note-index={i} onClick={() => selectNote(i)} aria-current={currentIndex === i ? 'step' : undefined} aria-label={`${sectionSelectionMode ? 'Select section endpoint' : 'Jump to note'} ${i + 1}: ${numberFor(note.midi)}, ${keyLabel(note.midi)}`} className={`number-note ${currentIndex === i ? 'current' : ''} ${loopRange && i >= loopRange.start && i <= loopRange.end ? 'in-section' : ''} ${sectionStart === i ? 'section-start' : ''}`}><b>{numberFor(note.midi)}</b><small>{keyLabel(note.midi)}</small></button>)}</div></div>
              <div className="section-loop-tools"><button className={sectionSelectionMode ? 'select-section active' : 'select-section'} onClick={toggleSectionSelection} aria-pressed={sectionSelectionMode}>{sectionSelectionMode ? 'Cancel selection' : 'Select a section'}</button><span>{sectionSelectionMode ? 'Choose a start and end note' : loopRange ? `Notes ${loopRange.start + 1}–${loopRange.end + 1} selected` : 'Repeat a short section to practise it'}</span><button className="loop-section-button" disabled={!loopRange} onClick={toggleSectionLoop} aria-pressed={isLoopingSection}>{isLoopingSection ? <Pause size={14} /> : <Repeat size={14} />}{isLoopingSection ? 'Pause loop' : 'Loop section'}</button>{loopRange && <button className="clear-section" onClick={clearSection}>Clear</button>}</div>
            </div>
            <div className="practice-area">
              <div className="practice-intro"><div><span className="practice-kicker">YOUR TURN</span><h4>{playAlong ? currentIndex >= song.notes.length - 1 ? 'Melody complete.' : 'Play the highlighted note.' : currentIndex < 0 ? 'Ready when you are.' : currentIndex >= song.notes.length - 1 ? 'Beautifully done.' : 'Find the highlighted note.'}</h4><p>{playAlong ? 'Use the piano keys or A–K on your keyboard. We’ll wait for each note.' : currentIndex < 0 ? 'Start with a listen, or take it one note at a time.' : currentIndex >= song.notes.length - 1 ? 'You played through the whole melody.' : 'Look for the glowing number, then play that key.'}</p></div><div className="next-note"><span>NEXT NOTE</span><b>{nextNote ? numberFor(nextNote.midi) : '—'}</b><small>{nextNote ? keyLabel(nextNote.midi) : 'complete'}</small></div></div>
              <div className={`practice-feedback ${answerFeedback.startsWith('Correct') || answerFeedback.startsWith('You found') ? 'is-correct' : ''}`} role="status" aria-live="polite">{answerFeedback}</div>
              <div className="keyboard-shell"><div className="keyboard-legend"><span>PIANO KEYS</span><span>Click a key or use <b>A–K</b> <span className="legend-separator">·</span> C4 is middle C</span><button className="fullscreen-open" onClick={togglePianoFullscreen} aria-label="Expand piano to full screen" title="Full screen piano"><Expand size={15} /><span>Full screen</span></button></div><div className="keyboard-scroll"><div className="piano-keyboard">{pianoMidis.map(midi => <PianoKey key={midi} midi={midi} active={activeMidi === midi || (currentIndex >= 0 && song.notes[currentIndex]?.midi === midi)} onPress={handlePracticeKey} />)}</div></div></div>
              <div className="controls-row"><button className={playAlong ? 'playalong-toggle active' : 'playalong-toggle'} onClick={togglePlayAlong} aria-pressed={playAlong}><Music2 size={14} />{playAlong ? 'Play along: on' : 'Play along'}</button><div className="transport"><button className="control-button reset-button" onClick={reset} aria-label="Start over"><RotateCcw size={15} /></button><button className="control-button previous-button" onClick={playPrevious} disabled={currentIndex < 0} aria-label="Previous note"><ArrowLeft size={15} /></button><button className="play-button" onClick={togglePlayback} aria-pressed={isPlaying}>{isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}<span>{isPlaying ? 'Pause' : 'Listen'}</span></button><button className="control-button next-button" onClick={playNext} disabled={currentIndex >= song.notes.length - 1} aria-label="Play next note"><ArrowRight size={15} /></button></div><label className="tempo-control"><span>TEMPO</span><input aria-label="Playback tempo" aria-valuetext={`${tempo} beats per minute`} type="range" min="50" max="130" value={tempo} onChange={event => setTempo(Number(event.target.value))} /><b>{tempo}</b><small>BPM</small></label></div>
            </div>
            </div>
          </div>
        </div>
        {!lessonStarted && <div className="below-lesson" id="how-it-works"><span><Headphones size={16} /> You can listen first. There’s no wrong way to begin.</span><button onClick={() => { setLessonStarted(true); if (currentIndex < 0) playNext() }}>Start learning <ArrowRight size={15} /></button></div>}
        {lessonStarted && <div className="below-lesson started-note"><span><Sparkles size={16} /> You’re doing great. Keep going at your own pace.</span><button onClick={() => { setLessonStarted(false); reset() }}>Reset lesson <RotateCcw size={14} /></button></div>}
        <div className="next-song-suggestion"><div><span>{songComplete ? 'Nice work. Try this next:' : 'When you’re ready, try next:'}</span>{nextSongRecommendation ? <><b>{nextSongRecommendation.title}</b><small>{nextSongRecommendation.level} · {nextSongRecommendation.duration}</small></> : <b>You’ve explored every song.</b>}</div>{nextSongRecommendation && <button onClick={() => selectSong(nextSongRecommendation.id)}>Try this song <ArrowRight size={14} /></button>}</div>
      </section>}
      {page === 'how' && <section className="how-page"><div className="how-intro"><span className="section-kicker">YOUR LEARNING PATH</span><h1>From first note to<br/><em>reading music.</em></h1><p>Build confidence in small steps. Use numbers as a guide while your eyes get used to the sheet music.</p></div><div className="how-steps"><article><span>01</span><div className="how-illustration">1 · 2 · 3</div><h3>Start with a number</h3><p>In our C-major examples, each number points to a note: C is 1, D is 2, and so on.</p></article><article><span>02</span><div className="how-illustration staff-illustration">𝄞 <b>• • •</b></div><h3>Connect it to the staff</h3><p>Follow the same note on the five lines and learn treble-clef note names as you play.</p></article><article><span>03</span><div className="how-illustration">C <b>→</b> ♫</div><h3>Find it on the piano</h3><p>Play the matching key, listen, and repeat at a speed that feels comfortable.</p></article></div><div className="how-cheatsheet"><div><span className="section-kicker">A QUICK CHEAT SHEET</span><h2>Reading the treble clef</h2><p>Start at the bottom line and move upward, one letter at a time.</p><div className="cheat-staff"><span>F — Every</span><span>D — Good</span><span>B — Bird</span><span>G — Does</span><span>E — Fly</span></div><p className="space-reminder">The spaces spell F · A · C · E</p></div><div className="number-cheats">{['C','D','E','F','G','A','B'].map((letter,i)=><span key={letter}><b>{letter}</b><small>{i+1}</small></span>)}</div></div><button className="how-start" onClick={() => navigate('songs')}>Choose a song to practise <ArrowRight size={16}/></button></section>}
      </div>
      {profileOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setProfileOpen(false) }}><form className="profile-modal" onSubmit={saveProfile}><button type="button" className="modal-close" aria-label="Close profile" onClick={() => setProfileOpen(false)}><X size={17}/></button><span className="section-kicker">YOUR KEYPATH PROFILE</span><h2>Your practice, your story.</h2><p>Keep track of the days you show up. Your details and practice history stay on this device.</p><div className="profile-photo-row"><div className="profile-large-avatar">{profile.avatarData ? <img src={profile.avatarData} alt="Your profile"/> : profile.name ? profile.name[0].toUpperCase() : <Music2 size={23}/>}</div><label className="photo-change">Choose a profile photo<input type="file" accept="image/*" onChange={uploadAvatar}/></label>{profile.avatarData && <button type="button" className="remove-photo" onClick={()=>setProfile({...profile,avatarData:''})}>Remove</button>}</div><div className="profile-fields"><label>Your name<input value={profile.name} onChange={event => setProfile({...profile,name:event.target.value})} placeholder="What should we call you?" maxLength={40}/></label><label>Your age <span className="optional">optional</span><input type="number" min="5" max="120" value={profile.age} onChange={event => setProfile({...profile,age:event.target.value})} placeholder="Age"/></label><label>Gender <span className="optional">optional</span><select value={profile.gender} onChange={event => setProfile({...profile,gender:event.target.value})}><option value="">Prefer not to say</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Self-describe</option></select></label></div><div className="profile-stats" aria-label="Practice totals"><div><Check size={15}/><b>{completedSongCount}</b><span>Songs completed</span></div><div><Clock3 size={15}/><b>{practiceMinutes}</b><span>Practice minutes</span></div><div><Music2 size={15}/><b>{activeDaysCount}</b><span>Active days</span></div></div><div className="practice-year"><div className="practice-year-heading"><div><b>Your practice year</b><small>{activeDaysCount} active days · {streakDays} day current streak</small></div><span className="streak-badge"><Sparkles size={13}/>{streakDays}</span></div><div className="calendar-month-labels"><span>Nov</span><span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span></div><div className="calendar-scroll"><div className="practice-calendar" aria-label="Practice activity for the past year">{activityCells.map(cell=><span key={cell.key} title={cell.title} aria-label={cell.title || 'Future date'} className={`calendar-day level-${cell.count === 0 ? 0 : cell.count < 4 ? 1 : cell.count < 10 ? 2 : cell.count < 20 ? 3 : 4} ${cell.future ? 'future' : ''}`}/>)}</div></div><div className="calendar-legend"><span>{encouragement}</span><div>Less <i className="level-0"/><i className="level-1"/><i className="level-2"/><i className="level-3"/><i className="level-4"/> More</div></div></div><button className="save-profile" type="submit">Save profile <Check size={15}/></button></form></div>}
      {welcomeQuestion && page === 'home' && <div className="modal-backdrop welcome-backdrop"><form className="welcome-question" onSubmit={event=>{event.preventDefault();finishWelcome()}}><div className="welcome-sparkle"><Sparkles size={17}/></div><span className="section-kicker">A QUICK HELLO</span><h2>How did you find Keypath?</h2><p>We’d love to know how you found your way here. This is a one-time question and you can skip it.</p><div className="discovery-options">{['Friend or family','Social media','Search engine','School or class','Other'].map(option=><button type="button" key={option} className={discoverySource===option?'chosen':''} onClick={()=>setDiscoverySource(option)}>{option}{discoverySource===option&&<Check size={14}/>}</button>)}</div><div className="welcome-question-actions"><button type="button" className="skip-question" onClick={()=>finishWelcome(true)}>Maybe later</button><button className="save-profile" type="submit">Continue <ArrowRight size={14}/></button></div></form></div>}
      <footer className="footer"><span className="footer-brand">keypath<span>.</span></span><span>Little by little, note by note.</span><button onClick={() => navigate('home')}>Back to home ↑</button></footer>
    </main>
  </div>
}

export default App
