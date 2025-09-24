import { useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Home from "./Pages/Home";
import Header from "./Component/Header";
import Footer from "./Component/Footer";
import MyEditor from "./Pages/MyEditor";

function App() {
  return (
    <>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<MyEditor />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </>
  );
}

export default App;
