
### SSO Implementation Plan for EduTrack

Single Sign-On (SSO) is indeed possible and supported in this project through Lovable Cloud. There are two primary ways to approach this depending on your requirements:

1.  **Social SSO (Google & Apple)**: This is available as a managed solution in Lovable Cloud. It allows teachers and admins to sign in using their existing Google or Apple accounts, providing a seamless "one-click" login experience.
2.  **Enterprise SSO (SAML 2.0 & OIDC)**: For schools using enterprise identity providers like Okta, Microsoft Entra ID (Azure AD), or Auth0, Lovable supports these protocols on the **Business** and **Enterprise** plans.

#### Proposed Technical Changes

**1. Authentication Layer Enhancement**
*   Update `src/contexts/AuthContext.tsx` to include a new `signInWithOAuth` function. This will wrap the Lovable Cloud (Supabase) OAuth implementation.
*   Add support for `google` and `apple` providers in the context.

**2. Login Page UI Update**
*   Modify `src/pages/auth/Login.tsx` to include social login buttons ("Continue with Google", "Continue with Apple").
*   Ensure these buttons follow branding guidelines for clarity and trust.

**3. Role-Based Redirection Handling**
*   Since OAuth login redirects the user back to the application, we need a robust redirection mechanism.
*   Update `src/pages/auth/Login.tsx` with a `useEffect` hook that detects if a user is already authenticated (via the session) and automatically redirects them to the appropriate dashboard (`/admin`, `/platform`, or `/progress` for teachers) based on their role.

**4. Platform Admin Configuration** (Technical Note)
*   While social login can be enabled in code, the "Managed Google/Apple Auth" handles the complex handshakes automatically in the background of Lovable Cloud.
*   If you require Enterprise SAML/OIDC, we would configure the specific Identity Provider metadata (Discovery URL, Client ID, etc.) in the backend settings.

#### User Experience for Parents
It's worth noting that parents currently use a form of "token-based SSO"—their unique secure links allow them to view student progress and fees without needing to remember a separate username or password, which is often the most effective "SSO" for occasional users like parents.

### Technical Implementation Steps

```text
1. Update AuthContext.tsx to support OAuth providers.
2. Create SocialLoginButtons component for reusability.
3. Integrate buttons into Login.tsx.
4. Implement automatic role-based redirection logic in the Login page.
```

Would you like me to proceed with implementing Social Login (Google/Apple) as a starting point for SSO?
