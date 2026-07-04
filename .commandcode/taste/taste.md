# Taste (Continuously Learned by [CommandCode][cmd])

[cmd]: https://commandcode.ai/

# expo
- For Expo SDK 51 with Expo Go, use expo-sqlite@~13.4.0 (not v14). v14's synchronous API requires New Architecture which Expo Go on SDK 51 does not support, causing runtime crashes. Confidence: 0.85
- When building Expo apps that need web support, use Metro for web (Expo 51 default), not @expo/webpack-config. webpack-config@19 conflicts with expo@51 (peer dependency requires expo@^49 or ^50). Confidence: 0.70

# workflow
- Verify .env files exist in both packages/mobile/ and packages/web/ before declaring the build ready. Missing .env files cause silent Supabase initialization failures and blank screens with no visible error. Confidence: 0.70

# supabase
- Use supabase.auth.getUser() not supabase.auth.getSession() for validating auth state on app load. getSession() only reads localStorage; getUser() validates the JWT server-side, preventing stale/forged sessions from granting unauthorized access. Confidence: 0.70

# code-organization
- For React Native + Web projects with platform-specific storage (SQLite vs localStorage), use platform file extensions: db.native.ts (SQLite) and db.web.ts (localStorage) with a shared db.ts fallback for TypeScript. Metro automatically resolves the correct file per platform with no import changes. Confidence: 0.60

# git
- When pushing to git, exclude .md, .txt, and .docx files from the commit. Confidence: 0.55

