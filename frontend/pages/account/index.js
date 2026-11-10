import ProtectedRoute from '../../components/ProtectedRoute';
import { ProfileContent } from './profile';

// /account has no dashboard of its own — the nav links here and the
// dashboard lives at /account/profile, so reuse it rather than duplicate.
// Signed-out visitors are sent to /auth/login?returnUrl=/account by the
// ProtectedRoute wrapper, landing back here after signing in.
export default function Account() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
