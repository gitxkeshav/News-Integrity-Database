import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AddUser from "./components/AddUser";
import AddSource from "./components/AddSource";
import AddArticle from "./components/AddArticle";
import ReportArticle from "./components/ReportArticle";
import AddCredibilityCheck from "./components/AddCredibilityCheck";
import ViewCredibilityChecks from "./components/ViewCredibilityChecks";
import ViewReports from "./components/ViewReports";

function App() {
  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">📰 Fake News Detection Database System</h2>
      <AddUser />
      <hr />
      <AddSource />
      <hr />
      <AddArticle />
      <hr />
      <ReportArticle />
      <hr />
      <AddCredibilityCheck />
      <hr />
      <ViewCredibilityChecks />
      <hr />
      <ViewReports />
    </div>
  );
}

export default App;
