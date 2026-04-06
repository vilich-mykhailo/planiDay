// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import StudioProvider from './context/studio/StudioProvider.jsx'
import BookingsProvider from './context/bookings/BookingsProvider'
import { FavouritesProvider } from './context/FavouritesContext.jsx'
import './styles//buttons.css'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <StudioProvider>
        <BookingsProvider>
          <FavouritesProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </FavouritesProvider>
        </BookingsProvider>
      </StudioProvider>
    </QueryClientProvider>
  </React.StrictMode>
)