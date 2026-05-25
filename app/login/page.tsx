import { cacheLife } from "next/cache";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  "use cache";
  cacheLife("max");
  return <LoginForm />;
}
