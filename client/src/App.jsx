import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import MyBooks from "./pages/author/MyBooks.jsx";
import NewTicket from "./pages/author/NewTicket.jsx";
import MyTickets from "./pages/author/MyTickets.jsx";
import TicketQueue from "./pages/admin/TicketQueue.jsx";
import TicketDetail from "./pages/admin/TicketDetail.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Author pages */}
      <Route element={<ProtectedRoute role="author" />}>
        <Route path="/books" element={<MyBooks />} />
        <Route path="/tickets" element={<MyTickets />} />
        <Route path="/tickets/new" element={<NewTicket />} />
      </Route>

      {/* Admin pages */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin/tickets" element={<TicketQueue />} />
        <Route path="/admin/tickets/:id" element={<TicketDetail />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
