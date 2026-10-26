import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { AdminShell } from "@/components/admin/AdminShell"
import { MemberShell } from "@/components/MemberShell"
import { RequireAuth } from "@/components/RequireAuth"
import { AuthProvider } from "@/context/AuthContext"
import { ToastProvider } from "@/context/ToastContext"
import { CollectHoldPage } from "@/pages/admin/CollectHoldPage"
import { BookFormPage } from "@/pages/admin/BookFormPage"
import { BooksPage } from "@/pages/admin/BooksPage"
import { CopiesPage } from "@/pages/admin/CopiesPage"
import { DashboardPage } from "@/pages/admin/DashboardPage"
import { DirectIssuePage } from "@/pages/admin/DirectIssuePage"
import { FinesPage } from "@/pages/admin/FinesPage"
import { MemberDetailPage } from "@/pages/admin/MemberDetailPage"
import { MembersPage } from "@/pages/admin/MembersPage"
import { OverduePage } from "@/pages/admin/OverduePage"
import { RequestsPage } from "@/pages/admin/RequestsPage"
import { ReturnPage } from "@/pages/admin/ReturnPage"
import { SettingsPage } from "@/pages/admin/SettingsPage"
import { BookDetailPage } from "@/pages/BookDetailPage"
import { BrowsePage } from "@/pages/BrowsePage"
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { GenrePage } from "@/pages/GenrePage"
import { LoginPage } from "@/pages/LoginPage"
import { LoanDetailPage } from "@/pages/LoanDetailPage"
import { MyBooksPage } from "@/pages/MyBooksPage"
import { MyFinesPage } from "@/pages/MyFinesPage"
import { NotFoundPage } from "@/pages/NotFoundPage"
import { NotificationsPage } from "@/pages/NotificationsPage"
import { ProfilePage } from "@/pages/ProfilePage"
import { SavedPage } from "@/pages/SavedPage"
import { SearchPage } from "@/pages/SearchPage"
import { SignupPage } from "@/pages/SignupPage"

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route
              path="/admin"
              element={
                <RequireAuth role="admin">
                  <AdminShell />
                </RequireAuth>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="collect" element={<CollectHoldPage />} />
              <Route path="issue" element={<DirectIssuePage />} />
              <Route path="return" element={<ReturnPage />} />
              <Route path="overdue" element={<OverduePage />} />
              <Route path="books" element={<BooksPage />} />
              <Route path="books/new" element={<BookFormPage />} />
              <Route path="books/:bookId/edit" element={<BookFormPage />} />
              <Route path="books/:bookId/copies" element={<CopiesPage />} />
              <Route path="members" element={<MembersPage />} />
              <Route path="members/:memberId" element={<MemberDetailPage />} />
              <Route path="fines" element={<FinesPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
            <Route
              element={
                <RequireAuth role="student">
                  <MemberShell />
                </RequireAuth>
              }
            >
              <Route path="/browse" element={<BrowsePage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/books/:bookId" element={<BookDetailPage />} />
              <Route path="/genres/:genre" element={<GenrePage />} />
              <Route path="/loans/:loanId" element={<LoanDetailPage />} />
              <Route path="/my-books" element={<MyBooksPage />} />
              <Route path="/my-fines" element={<MyFinesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/saved" element={<SavedPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
