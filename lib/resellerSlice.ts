import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isResellerLoggedIn: false,
  reseller: {
    _id: "",
    name: "",
    avatar: "",
    phone: "",
    email: "",
    telegramId: "",
    whatsapp: "",
    password: "",
    balance: 0,
    users: [],
    isBanned: false,
    createdAt: Date,
    updatedAt: Date,
  },
};
const resellerSlice = createSlice({
  name: "admin",
  initialState: initialState,
  reducers: {
    resellerLogin: (state, action) => {
      state.isResellerLoggedIn = true;
      state.reseller = action.payload;
    },
    resellerLogout: (state) => {
      state.isResellerLoggedIn = false;
      state.reseller = initialState.reseller;
    },
    setUsers: (state, action) => {
      state.reseller.users = action.payload;
    },
  },
});
export const { resellerLogin, resellerLogout, setUsers } = resellerSlice.actions;
export default resellerSlice.reducer;
