import React from "react";
import { IntlProvider } from "react-intl";
import { QueryClient, QueryClientProvider } from "react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { translations } from "./components/translations";
import { AttributesPage } from "./pages/AttributesPage";
import { ErrorPage } from "./pages/ErrorPage";
import { LandingPage } from "./pages/LandingPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <IntlProvider
        locale={navigator.language}
        messages={translations[navigator.language]}
      >
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="error" element={<ErrorPage />} />
            <Route path="attributes" element={<AttributesPage />} />
          </Routes>
          <Footer />
        </BrowserRouter>
      </IntlProvider>
    </QueryClientProvider>
  );
}

export default App;
