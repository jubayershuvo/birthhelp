import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState = {
  isLoggedIn: false,
  token: "",
  refreshToken: "",
  user: {
    _id: "",
    name: "",
    username: "",
    email: "",
    avatar: "",
    isEmailVerified: false,
    isBanned: false,
    isActive: false,
    loginAttempts: 0,
    createdAt: "",
    updatedAt: "",
    lastLogin: "",
    lastSeen: "",
    lastLoginIp: "",
    location: "",
    // Added to satisfy User type
    password: "",
    balance: 0,
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    userLogin: (
      state,
      action: PayloadAction<{
        user: typeof initialState.user;
        token: string;
        refreshToken: string;
      }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isLoggedIn = true;
    },
    userLogout: () => ({ ...initialState }), // fresh state reset
    updateUser: (state, action: PayloadAction<Partial<typeof initialState.user>>) => {
      state.user = { ...state.user, ...action.payload };
    },
  },
});

export const { userLogin, userLogout, updateUser } = userSlice.actions;
export default userSlice.reducer;
