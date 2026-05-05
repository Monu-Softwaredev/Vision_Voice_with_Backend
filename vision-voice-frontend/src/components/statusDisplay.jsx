import React from 'react'


export default function StatusDisplay({ status }) {
return <div id="status" className="text-lg text-gray-400 h-6 transition-colors duration-300">{status}</div>
}