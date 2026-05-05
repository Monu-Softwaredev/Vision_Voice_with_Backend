import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/landing'
import Assistant from './pages/assistant'


function App() {
return (
<BrowserRouter>
<Routes>
<Route path="/" element={<Landing />} />
<Route path="/assistant" element={<Assistant />} />
</Routes>
</BrowserRouter>
)
}


export default App