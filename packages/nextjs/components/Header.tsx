"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, PlusCircleIcon, ShoppingCartIcon, TrophyIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { NetworkOptions } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton/NetworkOptions";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Validation",
    href: "/validation",
    icon: <TrophyIcon className="h-4 w-4" />,
  },
  {
    label: "Create NFT",
    href: "/create",
    icon: <PlusCircleIcon className="h-4 w-4" />,
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    icon: <ShoppingCartIcon className="h-4 w-4" />,
  },
  {
    label: "Matches",
    href: "/match",
    icon: <TrophyIcon className="h-4 w-4" />,
  },
];

export const HeaderMenuLinks = () => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon }) => {
        const isActive = pathname === href;
        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              className={`${
                isActive ? "bg-secondary shadow-md text-secondary-content" : ""
              } hover:bg-secondary hover:shadow-md hover:text-secondary-content focus:!bg-secondary active:!text-neutral py-2 px-4 text-sm font-medium rounded-full gap-2 grid grid-flow-col transition-all duration-200`}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  const [isVisible, setIsVisible] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    // If not on home page, always show header
    if (pathname !== "/") {
      setIsVisible(true);
      return;
    }

    // On home page, show only after scrolling past the intro (approx 5600px)
    const handleScroll = () => {
      if (window.scrollY > 5600) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    // Initial check
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 navbar bg-base-100/90 backdrop-blur-xl min-h-[4rem] shrink-0 justify-between z-50 shadow-lg shadow-base-300/20 px-4 sm:px-6 font-sans border-b border-base-200 transition-all duration-500 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <div className="navbar-start w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-1/2" />
          </summary>
          <ul
            className="menu menu-compact dropdown-content mt-3 p-2 shadow-sm bg-base-100 rounded-box w-52"
            onClick={() => {
              burgerMenuRef?.current?.removeAttribute("open");
            }}
          >
            <HeaderMenuLinks />
          </ul>
        </details>
        <Link href="/" passHref className="hidden lg:flex items-center gap-3 ml-4 mr-8 shrink-0 group">
          <div className="flex relative w-10 h-10 transition-transform group-hover:rotate-12 duration-300">
            <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.svg" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Robotics eSports
            </span>
            <span className="text-xs text-base-content/60 font-medium tracking-widest uppercase">
              Transparent Results
            </span>
          </div>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-6">
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end grow mr-4">
        {/* Network switch pill */}
        <details className="dropdown dropdown-end hidden md:block mr-2">
          <summary className="btn btn-sm btn-outline rounded-full px-3 hover:bg-secondary hover:border-secondary transition-all duration-300">
            {targetNetwork.name}
          </summary>
          <ul className="menu dropdown-content mt-2 p-2 shadow bg-base-100 rounded-box w-56">
            <NetworkOptions />
          </ul>
        </details>
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
