import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <SignUp
      appearance={{
        variables: {
          colorPrimary: "#e8431a",
          colorBackground: "#111114",
          colorInputBackground: "#18181d",
          colorInputText: "#f0eff4",
          colorText: "#f0eff4",
          colorTextSecondary: "#7c7b8a",
          colorNeutral: "#7c7b8a",
          borderRadius: "8px",
          fontFamily: "var(--font-dm-sans), DM Sans, sans-serif",
        },
        elements: {
          card: {
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          },
          footerAction: { color: "#7c7b8a" },
          formButtonPrimary: {
            background: "#e8431a",
            "&:hover": { background: "#d03d18" },
          },
        },
      }}
    />
  );
}
