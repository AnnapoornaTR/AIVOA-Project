import { configureStore } from '@reduxjs/toolkit';
import deviationReducer from './deviationSlice';

export const store = configureStore({
  reducer: {
    deviation: deviationReducer,
  },
});

export default store;
