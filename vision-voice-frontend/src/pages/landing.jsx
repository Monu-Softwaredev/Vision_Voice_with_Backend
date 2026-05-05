import React from 'react'
import { useNavigate } from 'react-router-dom'


export default function Landing() {
const navigate = useNavigate()


return (
<div className="min-h-screen animated-gradient-bg text-gray-200">
<header className="sticky top-0 z-50 bg-gray-900/30 backdrop-blur-lg border-b border-white/10">
<div className="container mx-auto px-6 py-4 flex justify-between items-center">
<div className="text-2xl font-bold">VisionVoice <span className="text-cyan-400"></span></div>
<nav className="flex items-center space-x-6">
{/* <button onClick={() => navigate('/assistant')} className="bg-cyan-500/80 hover:bg-cyan-500 text-white font-semibold py-2 px-5 rounded-full text-sm">Launch App</button> */}
</nav>
</div>
</header>


<main className="container mx-auto px-6 py-24 md:py-32">
<div id="hero-card" className="glass-card max-w-4xl mx-auto rounded-3xl p-10 md:p-16 text-center">
<h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">See the World, <span className="gradient-text">Guided by AI</span></h1>
<p className="text-xl md:text-2xl text-gray-300 font-normal max-w-3xl mx-auto mb-10">An intelligent visual assistant designed to empower the visually impaired by describing the world around them in real-time.</p>
<button onClick={() => navigate('/assistant')} className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 px-10 rounded-full text-lg">Launch the Assistant</button>
</div>
</main>


<footer className="text-center py-10 text-gray-500">&copy; 2025 VisionVoice. All rights reserved.</footer>
</div>
)
}