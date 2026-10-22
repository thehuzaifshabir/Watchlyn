/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Footer } from './components/Footer';
import { PersonModal } from './components/PersonModal';
import { AddToListModal } from './components/AddToListModal';
import { Toast } from './components/Toast';

import { HomeView } from './views/HomeView';
import { MoviesView } from './views/MoviesView';
import { SeriesView } from './views/SeriesView';
import { DetailView } from './views/DetailView';
import { SearchView } from './views/SearchView';
import { AnimeView } from './views/AnimeView';
import { AccountView } from './views/AccountView';
import { ProviderCatalogView } from './views/ProviderCatalogView';
import { AuthProvider } from './context/AuthContext';

const AppContent: React.FC = () => {
  const { route } = useApp();

  // Route Matcher
  const renderView = () => {
    const { pathname, params } = route;

    if (pathname === '/') {
      return <HomeView />;
    }
    if (pathname.startsWith('/movies')) {
      return <MoviesView />;
    }
    if (pathname.startsWith('/series')) {
      return <SeriesView />;
    }
    if (pathname.startsWith('/anime')) {
      return <AnimeView />;
    }
    if (pathname.startsWith('/account') || pathname.startsWith('/lists')) {
      return <AccountView />;
    }
    if (pathname.startsWith('/movie/') && params.id) {
      return <DetailView key={`movie-${params.id}`} mediaType="movie" id={parseInt(params.id, 10)} />;
    }
    if (pathname.startsWith('/tv/') && params.id) {
      return <DetailView key={`tv-${params.id}`} mediaType="tv" id={parseInt(params.id, 10)} />;
    }
    if (pathname.startsWith('/provider/') && params.id) {
      return <ProviderCatalogView key={`provider-${params.id}`} providerId={parseInt(params.id, 10)} />;
    }
    if (pathname.startsWith('/search')) {
      return <SearchView />;
    }

    // Default fallback
    return <HomeView />;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-[#f8fafc] selection:bg-[#e50914] selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1">
        {renderView()}
      </main>

      {/* Global Footer with Cinejoy disclaimer */}
      <Footer />

      {/* Fixed Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Modals & Overlays */}
      <PersonModal />
      <AddToListModal />
      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </AuthProvider>
  );
}
