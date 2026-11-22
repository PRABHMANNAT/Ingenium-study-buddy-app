import { useRef, useState } from 'react'
import { ArrowLeft, ArrowUp, AudioLines, FileText, Image as ImageIcon, Languages, Mic, X, Sparkles } from 'lucide-react'
import './App.css'

type Message = { role: 'user' | 'assistant'; text: string }
const cards = [
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'audio', label: 'Audio Chat', icon: Mic },
  { id: 'files', label: 'Chat Files', icon: FileText },
  { id: 'images', label: 'Images', icon: ImageIcon },
] as const

function App() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [notice, setNotice] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  function reset() { setMessages([]); setInput(''); setNotice('') }
  function send() {
    if (!input.trim()) return
    const text = input.trim()
    setMessages(previous => [...previous, { role: 'user', text }, { role: 'assistant', text: 'This is a UI preview. Connect an AI service to get a personalized response.' }])
    setInput('')
    setNotice('')
  }
  function choose(id: typeof cards[number]['id']) {
    if (id === 'translate') { setInput('Translate this text: '); inputRef.current?.focus() }
    if (id === 'audio') setNotice('Audio chat will be available when an AI voice service is connected.')
    if (id === 'files') fileRef.current?.click()
    if (id === 'images') imageRef.current?.click()
  }
  return <main className="page"><div className="ambient ambient-one"/><div className="ambient ambient-two"/><section className="app-shell" aria-label="Ingenium chat">
    <header className="topbar"><button aria-label="Start a new chat" onClick={reset}><ArrowLeft size={19}/></button><span>New Chat</span><button aria-label="Clear conversation" onClick={reset}><X size={19}/></button></header>
    <div className="content">
      <div className="greeting"><img src="/aafreen-avatar.png" alt="AI avatar of Aafreen"/><div><p>Hi, Aafreen!</p><h1>How can I help you?</h1></div></div>
      {messages.length === 0 ? <><div className="divider"/><div className="cards">{cards.map(({id,label,icon:Icon}) => <button key={id} className={`card ${id}`} onClick={() => choose(id)}><div className="card-art" aria-hidden="true">{id === 'translate' && <><div className="translate-back">文</div><div className="translate-front">G</div></>}{id === 'audio' && <div className="audio-art"><AudioLines size={48} strokeWidth={1.6}/></div>}{id === 'files' && <><div className="doc doc-back"><span>☰</span></div><div className="doc doc-front"><span>⌁</span><small>PDF</small></div></>}{id === 'images' && <div className="image-art"><span>✦</span><ImageIcon size={58} strokeWidth={1}/></div>}</div><div className="card-label"><span className="card-icon"><Icon size={18} strokeWidth={2.2}/></span><span>{label}</span></div></button>)}</div></> : <div className="messages" aria-live="polite">{messages.map((message,i)=><div key={i} className={`message ${message.role}`}>{message.text}</div>)}</div>}
      {notice && <div className="notice" role="status"><Sparkles size={16}/><span>{notice}</span><button aria-label="Dismiss" onClick={()=>setNotice('')}><X size={16}/></button></div>}
    </div>
    <form className="composer" onSubmit={e => { e.preventDefault(); send() }}><input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask me anything ..." aria-label="Ask me anything"/><button type="submit" aria-label="Send message" disabled={!input.trim()}><ArrowUp size={19}/></button></form>
    <input ref={fileRef} type="file" hidden onChange={e=>{const f=e.target.files?.[0]; if(f) setNotice(`${f.name} selected. File chat needs an AI service connection.`); e.target.value=''}}/><input ref={imageRef} type="file" accept="image/*" hidden onChange={e=>{const f=e.target.files?.[0]; if(f) setNotice(`${f.name} selected. Image chat needs an AI service connection.`); e.target.value=''}}/>
    <p className="footnote">A little help for your big ideas.</p>
  </section></main>
}
export default App
