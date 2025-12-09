import React from "react";
import Link from "next/link";
import { hardhat } from "viem/chains";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { SwitchTheme } from "~~/components/SwitchTheme";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

/**
 * Site footer
 */
export const Footer = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <div className="min-h-0 py-5 px-1 mb-11 lg:mb-0">
      <div>
        <div className="flex justify-between items-center w-full p-4">
          {/* Left: social buttons */}
          <div className="flex gap-3">
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="btn btn-ghost">
              <svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true" className="fill-current">
                <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2 .37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"></path>
              </svg>
            </a>
            <a href="https://twitter.com/" target="_blank" rel="noreferrer" className="btn btn-ghost">
              <svg viewBox="0 0 24 24" width="22" height="22" className="fill-current">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 0 0 1.88-2.36 8.5 8.5 0 0 1-2.7 1.03 4.25 4.25 0 0 0-7.24 3.87A12.07 12.07 0 0 1 3.15 4.6a4.25 4.25 0 0 0 1.32 5.67 4.23 4.23 0 0 1-1.92-.53v.05a4.25 4.25 0 0 0 3.41 4.17 4.3 4.3 0 0 1-1.91.07 4.26 4.26 0 0 0 3.97 2.95A8.53 8.53 0 0 1 2 19.54a12.04 12.04 0 0 0 6.53 1.91c7.84 0 12.13-6.49 12.13-12.12 0-.19 0-.39-.01-.58A8.66 8.66 0 0 0 22.46 6Z"></path>
              </svg>
            </a>
            <a href="https://discord.com/" target="_blank" rel="noreferrer" className="btn btn-ghost">
              <svg viewBox="3 0 16 16" width="22" height="22" className="fill-current">
                <path d="M20.317 4.369A19.791 19.791 0 0 0 16.558 3c-.2.36-.434.848-.595 1.231a18.27 18.27 0 0 0-4.926 0A12.26 12.26 0 0 0 10.442 3a19.736 19.736 0 0 0-3.761 1.369C3.97 7.194 3.275 10.13 3.5 13.027A19.9 19.9 0 0 0 7.14 15c.29-.4.55-.83.78-1.28a12.86 12.86 0 0 0 1.48.18c.5.04 1 .06 1.5.06s1-.02 1.5-.06c.51-.04 1.01-.1 1.51-.18.23.45.49.88.78 1.28a19.86 19.86 0 0 0 3.64-1.973c.29-3.146-.57-6.053-2.952-8.487Z"></path>
              </svg>
            </a>
          </div>
          {/* Middle: contact and terms */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/contact" className="btn btn-sm btn-ghost">
              <ChatBubbleOvalLeftEllipsisIcon className="h-4 w-4" />
              <span>Contact Us</span>
            </Link>
            <Link href="/terms" className="btn btn-sm btn-ghost">
              <DocumentTextIcon className="h-4 w-4" />
              <span>Terms of Use</span>
            </Link>
          </div>
          {/* Right: theme switch */}
          <SwitchTheme className={`pointer-events-auto ${isLocalNetwork ? "self-end md:self-auto" : ""}`} />
        </div>
      </div>
      <div className="w-full" />
    </div>
  );
};
