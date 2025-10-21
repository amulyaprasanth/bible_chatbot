import { Squash as Hamburger } from "hamburger-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/react.svg";

interface NavbarProps {
  user: { id: number; name: string } | null;
  setUser: React.Dispatch<
    React.SetStateAction<{ id: number; name: string } | null>
  >;
}

export const Navbar = ({ user, setUser }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    setDropdownOpen(false);
    navigate("/"); // redirect to home
  };


  return (
    <nav className="sticky top-0 z-50 w-full bg-white dark:bg-gray-900 shadow-md">
      <div className="max-w-screen-xl mx-auto flex flex-wrap items-center justify-between p-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center space-x-3 rtl:space-x-reverse"
          onClick={closeMenu}
        >
          <img
            src={logo}
            className="h-8 sm:h-10 transition-transform duration-500 hover:rotate-12"
            alt="Logo"
          />
          <span className="text-xl sm:text-2xl font-bold text-[#6653A0] tracking-wide">
            VerseChat
          </span>
        </Link>

        {/* Hamburger Icon */}
        <div className="md:hidden">
          <Hamburger
            toggled={isOpen}
            toggle={setIsOpen}
            size={24}
            color="#6653A0"
            duration={0.5}
          />
        </div>

        {/* Navigation Links */}
        <div
          className={`w-full md:w-auto md:flex ${
            isOpen ? "block" : "hidden"
          } absolute md:relative top-16 left-0 md:top-0 bg-white dark:bg-gray-900 md:bg-transparent shadow-lg md:shadow-none border-t md:border-t-0 border-gray-200 transition-all duration-300 ease-in-out`}
        >
          <ul className="flex flex-col md:flex-row md:items-center md:space-x-6 p-4 md:p-0">
            <li>
              <Link
                to="/"
                className="block py-3 px-4 md:px-0 font-semibold text-[#6653A0] rounded hover:text-[#D17E73] hover:bg-[#6653A0]/10 md:hover:bg-transparent hover:scale-105 transition-all duration-300"
                onClick={closeMenu}
              >
                Home
              </Link>
            </li>
            <li>
              <a
                href="/#about"
                className="block py-3 px-4 md:px-0 font-semibold text-[#6653A0] rounded hover:text-[#D17E73] hover:bg-[#6653A0]/10 md:hover:bg-transparent hover:scale-105 transition-all duration-300"
                onClick={closeMenu}
              >
                About
              </a>
            </li>
            <li className="mt-2 md:mt-0 relative" >
              {user ? (
                <div>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold cursor-pointer select-none"
                    aria-label="User menu"
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50">
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/signin"
                  className="block py-3 px-6 text-center font-bold text-white bg-black rounded-full shadow-lg hover:bg-gray-800 hover:scale-105 transition-all duration-300"
                  onClick={closeMenu}
                >
                  SignIn / Signup
                </Link>
              )}
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
