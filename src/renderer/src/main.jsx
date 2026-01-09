import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LanguageProvider } from './context/LanguageContext'
import { AppProvider } from './context/AppContext'
import { ToastProvider } from './context/ToastContext'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <LanguageProvider>
            <ToastProvider>
                <AppProvider>
                    <App />
                </AppProvider>
            </ToastProvider>
        </LanguageProvider>
    </React.StrictMode>
)

