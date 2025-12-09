import { TRPCProvider } from "@/lib/trpc/provider";

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TRPCProvider>{children}</TRPCProvider>;
}
