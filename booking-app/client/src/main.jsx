import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import StudioProvider from './context/studio/StudioProvider.jsx'
import BookingsProvider from './context/bookings/BookingsProvider'
import './styles//buttons.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StudioProvider>
      <BookingsProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </BookingsProvider>
    </StudioProvider>
  </React.StrictMode>
)
