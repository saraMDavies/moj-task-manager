import type { Metadata } from "next";
import MuiProvider from "@/components/MuiProvider";

export const metadata: Metadata = {
  title: "Task Manager",
  description: "Simple task manager",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}
