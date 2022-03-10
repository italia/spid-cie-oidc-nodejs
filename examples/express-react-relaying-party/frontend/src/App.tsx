import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { AttributesPage } from "./pages/AttributesPage";
import { ErrorPage } from "./pages/ErrorPage";
import { LandingPage } from "./pages/LandingPage";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="landing" element={<LandingPage />} />
        <Route path="error" element={<ErrorPage />} />
        <Route path="attributes" element={<AttributesPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
