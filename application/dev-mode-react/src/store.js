// src/features/store.js
import { configureStore } from "@reduxjs/toolkit";
// import yourSlice from './yourSlice';

const store = configureStore({
  reducer: {
    // yourReducer: yourSlice
  },
});

export default store;
