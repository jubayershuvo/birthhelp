import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  email: "",
  step1: "",
  step2: "",
  step3: "",
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    storeData: (state, action) => {
      state.email = action.payload.email;
      state.step1 = action.payload.step1;
      state.step2 = action.payload.step2;
      state.step3 = action.payload.step3;
    },
  },
});

export const { storeData } = dataSlice.actions;
export default dataSlice.reducer;
