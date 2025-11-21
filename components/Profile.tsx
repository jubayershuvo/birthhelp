"use client";
import React from "react";
import API from "@/lib/api";

function ProfilePage() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const handleProfile = async () => {
    try {
      const response = await API.get("/bdris/profile");
      setUser(response.data.user);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    handleProfile();
  }, []);

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>{error}</div>;
  if (!user) return <div>No user data found.</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Profile</h1>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      {user.isAdmin && <p><strong>Role:</strong> Admin</p>}
    </div>
  );
}

export default ProfilePage;
