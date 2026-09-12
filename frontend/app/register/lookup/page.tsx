import type { Metadata } from "next";
import LookupForm from "./LookupForm";

export const metadata: Metadata = {
  title: "Check Your Registration Status",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LookupPage() {
  return <LookupForm />;
}