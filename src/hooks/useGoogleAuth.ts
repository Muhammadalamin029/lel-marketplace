import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useAuthStore } from "@/store/authStore";

WebBrowser.maybeCompleteAuthSession();

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

function googleClientId(): string {
  const id =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ??
    "";
  return id;
}

export function isGoogleAuthConfigured(): boolean {
  return googleClientId().length > 0;
}

/**
 * Google Sign-In via browser OAuth (implicit id_token flow), mirroring web's
 * GoogleLogin → POST /auth/google. Returns an id_token the caller exchanges
 * with the backend via authStore.loginWithGoogle().
 */
export function useGoogleIdTokenRequest() {
  const clientId = googleClientId();
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "lelmarketplace",
    path: "auth/google",
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      responseType: AuthSession.ResponseType.IdToken,
      scopes: ["openid", "profile", "email"],
      extraParams: { nonce: "lel-marketplace-nonce" } as Record<string, string>,
    },
    discovery,
  );

  return { request, response, promptAsync, redirectUri, configured: clientId.length > 0 };
}

export async function handleGoogleResponse(
  response: AuthSession.AuthSessionResult | null,
  redirect?: string | string[],
): Promise<{ redirectTarget: string }> {
  if (!response || response.type !== "success") {
    const err =
      response?.type === "error"
        ? ((response as unknown as { error?: { message?: string } }).error?.message ??
          "Google sign-in failed.")
        : "Google sign-in was cancelled.";
    throw new Error(err);
  }
  const params = response.params as Record<string, string | undefined>;
  const idToken = params.id_token;
  if (!idToken) throw new Error("Google did not return an ID token. Please try again.");
  await useAuthStore.getState().loginWithGoogle(idToken);
  const { user } = useAuthStore.getState();
  if (!user?.email_verified) {
    return { redirectTarget: `/(auth)/verify-email?email=${encodeURIComponent(user?.email ?? "")}` };
  }
  const target =
    typeof redirect === "string" && redirect.length > 0 ? redirect : "/(tabs)";
  return { redirectTarget: target };
}
