"use client";

import type { NextPage } from "next";

const Profile: NextPage = () => {
  return (
    <div className="flex items-center flex-col flex-grow pt-10">
      <div className="px-5">
        <h1 className="text-center mb-8">
          <span className="block text-2xl mb-2">Welcome to your</span>
          <span className="block text-4xl font-bold">Profile</span>
        </h1>
        <p className="text-center text-lg">This page is currently under construction.</p>
      </div>
    </div>
  );
};

export default Profile;
