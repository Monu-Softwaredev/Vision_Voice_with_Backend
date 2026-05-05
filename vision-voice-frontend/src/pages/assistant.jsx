import React, { useState } from 'react'
import VideoFeed from '../components/videoFeed'
import ControlButtons from '../components/controlButtons'
import StatusDisplay from '../components/statusDisplay'
import ResponseBox from '../components/responseBox'
import useSpeechSynthesis from '../hooks/useSpeechSynthesis'


export default function Assistant() {
const [status, setStatus] = useState('Click "Start" to begin...')
const [responseText, setResponseText] = useState('')


const { speak } = useSpeechSynthesis()


return (
<div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-gray-900 to-black text-white">
<div className="w-full max-w-3xl bg-gray-800/60 backdrop-blur-lg border border-white/10 rounded-3xl shadow-2xl p-6 md:p-10 space-y-8">
<h1 className="text-4xl font-bold text-center text-cyan-300 tracking-tight">Visual Assistant</h1>


<div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video ring-1 ring-white/10">
<VideoFeed setStatus={setStatus} setResponseText={setResponseText} speak={speak} />
</div>


<ControlButtons setStatus={setStatus} />


<StatusDisplay status={status} />


<div className="bg-gray-900/50 p-6 rounded-2xl min-h-[120px] flex items-center justify-center shadow-inner ring-1 ring-white/10">
<ResponseBox text={responseText} />
</div>
</div>
</div>
)
}