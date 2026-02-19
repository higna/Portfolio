import React from "react";
import { Link } from "react-router";

const Footer = () => {
  return (
    <footer className="bg-base-200 border-t border-base-content/10 py-4">
      <div className="mx-auto max-w-7xl px-4">
        {/* Mobile: Stack vertically */}
        <div className="flex flex-col gap-4 text-center md:hidden text-sm text-base-content/70">
          <Link to={"/"} className="font-medium">
            JayStan Espire Enclave
          </Link>
          <div className="flex gap-4 justify-center">
            <Link to={"/privacy"}>Privacy</Link>
            <Link to={"/terms"}>Terms</Link>
            <Link to={"/contact"}>Contact</Link>
          </div>
          <p>© {new Date().getFullYear()}. All rights reserved.</p>
        </div>

        {/* Desktop: Three columns */}
        <div className="hidden md:flex justify-between items-center text-sm text-base-content/70">
          <Link to={"/"} className="font-medium">
            JayStan Espire Enclave
          </Link>
          <p>© {new Date().getFullYear()}. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to={"/privacy"}>Privacy</Link>
            <Link to={"/terms"}>Terms</Link>
            <Link to={"/about#contact"}>Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;