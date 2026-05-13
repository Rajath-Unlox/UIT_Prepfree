import { Suspense } from "react";
import ClientCode from "./ClientCode";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientCode />
    </Suspense>
  );
}
