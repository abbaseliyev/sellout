import React from "react";

const Home = React.lazy(() => import("./Home"));

export const routes = [
  {
    path: "/",
    element:Home,
  },
];
