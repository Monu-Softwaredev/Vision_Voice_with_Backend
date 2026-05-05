import React, { useState } from 'react'


export default function ControlButtons({ setStatus }) {
const [active, setActive] = useState(false)


const handleStart = async () => {
setActive(true)
if (window.__visionlink && window.__visionlink.start) {
await window.__visionlink.start()
}
setStatus('Listening...')
}


const handleStop = () => {
setActive(false)
if (window.__visionlink && window.__visionlink.stop) {
window.__visionlink.stop()
}
setStatus('Stopped')
}


return (
<div className="flex justify-center space-x-4">
<button onClick={handleStart} disabled={active} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 px-8 rounded-full text-lg">Start Assistant</button>
<button onClick={handleStop} disabled={!active} className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold py-3 px-8 rounded-full text-lg">Stop Assistant</button>
</div>
)
}