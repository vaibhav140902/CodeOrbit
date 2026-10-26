import { Footer } from "./footer";
import { Topbar } from "./topbar";

export function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      {children}
      <Footer />
    </>
  );
}
