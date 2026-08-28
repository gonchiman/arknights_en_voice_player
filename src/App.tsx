import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { DictationPage } from './pages/DictationPage'
import { EndfieldModePage } from './pages/EndfieldModePage'
import { FavoritesPage } from './pages/FavoritesPage'
import { OperatorsPage } from './pages/OperatorsPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<OperatorsPage />} />
        <Route path="favorites" element={<FavoritesPage />} />
        <Route path="dictation" element={<DictationPage />} />
        <Route path="endfield" element={<EndfieldModePage section="operators" />} />
        <Route path="endfield/favorites" element={<EndfieldModePage section="favorites" />} />
        <Route path="endfield/dictation" element={<EndfieldModePage section="dictation" />} />
        <Route path="endfield/*" element={<Navigate to="/endfield" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
