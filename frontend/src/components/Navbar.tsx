import { useState } from "react";
import { Link } from "react-router-dom";
import { Squash as Hamburger } from "hamburger-react";
import logo from "../assets/react.svg";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

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
            label="Show menu"
          />
        </div>

        {/* Navigation Links */}
        <div
          id="mobile-menu"
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
            <li className="mt-2 md:mt-0">
              <Link
                to="/signin"
                className="block py-3 px-6 text-center font-bold text-white bg-black rounded-full shadow-lg hover:bg-gray-800 hover:scale-105 transition-all duration-300"
                onClick={closeMenu}
              >
                SignIn / Signup
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
