import { useState } from 'react'
import './App.css'
import PreCallIntel from './components/PreCallIntel'
import ColdEmail from './components/ColdEmail'
import FollowUp from './components/FollowUp'
import LiveSimulator from './components/LiveSimulator'

function App() {
  const [activeTab, setActiveTab] = useState('precall')

  const tabs = [
    { id: 'precall', label: 'Pre-Call Intel' },
    { id: 'email', label: 'Cold Email' },
    { id: 'followup', label: 'Follow-Up' },
    { id: 'simulator', label: 'Live Simulator' }
  ]

  return (
    <div className="app">
      <h1>Sales Toolkit</h1>
      <p>Pre-call intel, cold email, follow-up, live simulator.</p>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={activeTab === tab.id ? 'tab active' : 'tab'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
  <div style={{ display: activeTab === 'precall' ? 'block' : 'none' }}>
    <PreCallIntel />
  </div>
  <div style={{ display: activeTab === 'email' ? 'block' : 'none' }}>
    <ColdEmail />
  </div>
  <div style={{ display: activeTab === 'followup' ? 'block' : 'none' }}>
    <FollowUp />
  </div>
  <div style={{ display: activeTab === 'simulator' ? 'block' : 'none' }}>
    <LiveSimulator />
  </div>
</div>
    </div>
  )
}

export default App