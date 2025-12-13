import { Router } from "express";

import authRouter from "./authRoute";
import docsRouter from "./docsRoute";
import userRouter from "./userRoutes";
import foodEntryRouter from "./foodEntryRoute";
import myRouter from "./myRoute";
import paymentsRouter from "./paymentRoute";
import reportRouter from "./reportRoute";
import notificationTestRouter from "./notificationTestRoute";

const appRouter = Router();

// all routes
const appRoutes = [
  {
    path: "/auth",
    router: authRouter,
  },
  {
    path: "/user",
    router: userRouter,
  },
  {
    path: "/docs",
    router: docsRouter,
  },
  {
    path: "/entries",
    router: foodEntryRouter,
  },
  {
    path: "/my",
    router: myRouter,
  },
  {
    path: "/payments",
    router: paymentsRouter,
  },
  {
    path: "/reports",
    router: reportRouter,
  },
  {
    path: "/notifications",
    router: notificationTestRouter,
  },
];

appRoutes.forEach(route => {
  appRouter.use(route.path, route.router);
});

export default appRouter;
