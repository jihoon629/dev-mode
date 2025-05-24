import React,{ useState } from "react";
import { Routes, Route } from "react-router-dom";
import AppLayOut from "../Layout/AppLayOut";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import MyPage from "../pages/MyPage";
import RegisterPage from "../pages/RegisterPage";
import NotFoundPage from "../pages/NotFoundPage";
import WillWritePage from "../pages/WillWritePage";
import WillList from "../pages/WillList";
import WillDetails from "../pages/WillDetails";
import UserProfileComponent from "../pages/UserProfileComponent";
const AppRouter = () => {
  return (
    <Routes>
      {/* AppLayout을 기본 레이아웃으로 적용 */}
      <Route element={<AppLayOut />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/write" element={<WillWritePage />} />
        <Route path="/success" element={<WillList/>}/>
        <Route path="/detail/:willId" element={<WillDetails />} />
        <Route path="/name" element={<UserProfileComponent />} />

      </Route>

      {/* NotFoundPage를 처리하는 라우트 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRouter;