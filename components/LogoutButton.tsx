import { logout } from "@/app/actions/auth";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
        Sair
      </button>
    </form>
  );
}
