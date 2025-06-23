// client/src/modules/deliveries/routes/index.ts

import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy loading delle pagine
const DeliveriesCalendar = lazy(() => import('../pages/DeliveriesCalendar'));
const DeliveriesList = lazy(() => import('../pages/DeliveriesList'));
const ContributorsList = lazy(() => import('../pages/ContributorsList'));
const ContributorForm = lazy(() => import('../pages/ContributorForm'));
const MaterialTypesList = lazy(() => import('../pages/MaterialTypesList'));
const MaterialTypeForm = lazy(() => import('../pages/MaterialTypeForm'));

const DeliveriesRoutes = () => {
  return (
    <Routes>
      {/* Calendario conferimenti - pagina principale */}
      <Route path="/calendar" element={<DeliveriesCalendar />} />
      
      {/* Lista conferimenti */}
      <Route path="/" element={<DeliveriesList />} />
      
      {/* Conferitori */}
      <Route path="/contributors" element={<ContributorsList />} />
      <Route path="/contributors/new" element={<ContributorForm />} />
      <Route path="/contributors/:id/edit" element={<ContributorForm />} />
      
      {/* Tipologie materiali */}
      <Route path="/material-types" element={<MaterialTypesList />} />
      <Route path="/material-types/new" element={<MaterialTypeForm />} />
      <Route path="/material-types/:id/edit" element={<MaterialTypeForm />} />
    </Routes>
  );
};

export default DeliveriesRoutes;