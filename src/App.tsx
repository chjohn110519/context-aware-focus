import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import ExperimenterPage from './pages/ExperimenterPage';
import PdfUploadPage from './pages/PdfUploadPage';
import IntroPage from './pages/IntroPage';
import SessionPage from './pages/SessionPage';
import SessionCompletePage from './pages/SessionCompletePage';
import SurveyPage from './pages/SurveyPage';
import FinalSurveyPage from './pages/FinalSurveyPage';
import DonePage from './pages/DonePage';

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={<ExperimenterPage />} />
          <Route path="/upload" element={<PdfUploadPage />} />
          <Route path="/session/intro" element={<IntroPage />} />
          <Route path="/session/complete/:condition" element={<SessionCompletePage />} />
          <Route path="/session/survey/:condition" element={<SurveyPage />} />
          <Route path="/session/final-survey" element={<FinalSurveyPage />} />
          <Route path="/session/done" element={<DonePage />} />
          <Route path="/session/:condition" element={<SessionPage />} />
        </Routes>
      </SessionProvider>
    </BrowserRouter>
  );
}
