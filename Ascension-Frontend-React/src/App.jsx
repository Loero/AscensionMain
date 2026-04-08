import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Arc from './pages/Arc'
import Mental from './pages/Mental'
import Test from './pages/Test'
import MainPage from './pages/MainPage'
import { AlertProvider } from "./components/AlertContext"

function App() {


  return (
    <>
      <AlertProvider>
        <BrowserRouter>

          <Routes>
            <Route path='/' element={<MainPage />} />
            <Route path='/dashboard' element={<Dashboard />} />
            <Route path='/arc' element={<Arc />} />
            <Route path='/mental' element={<Mental />} />
            <Route path='/test' element={<Test />} />
            <Route path='*' element={<MainPage />} />
          </Routes>
        </BrowserRouter>
      </AlertProvider>
    </>
  )
}

export default App
