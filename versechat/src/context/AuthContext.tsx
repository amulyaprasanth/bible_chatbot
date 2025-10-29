import { createContext, type Dispatch, type SetStateAction } from "react";

interface AuthContextProps {
  isAuthenticated: boolean | null;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
  user: { name: string; profile_picture: string } | null;
  setUser: Dispatch<
    SetStateAction<{ name: string; profile_picture: string } | null>
  >;
}

export const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: null,
  setIsAuthenticated: () => {},
  user: null,
  setUser: () => {},
});
