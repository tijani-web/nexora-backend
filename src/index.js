import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import colors from "colors";
import { configDotenv } from "dotenv";

import answerRoutes from "./routes/answerRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import oauthRoutes from "./routes/oauthRoutes.js";
import userRoutes from "./routes/userRoutes.js"
import voteRoutes from "./routes/voteRoutes.js"
import activityRoutes from "./routes/activityRoutes.js"
import notificationRoutes from "./routes/notificationRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import searchRoutes from "./routes/searchRoutes.js"
import bookmarkRoutes from "./routes/bookmarkRoutes.js"
import aiRoutes from "./routes/aiContentRoutes.js"
import aiChatRoutes from "./routes/aiChatRoutes.js"
import debugRoutes from "./routes/debugRoutes.js"
import statsRoutes from "./stats/route.js"
import logger from "./middleware/logger.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/error.js";

// Load env
configDotenv();

const app = express();
const port = process.env.PORT || 5000;

// CORS for frontend
app.use(
  cors({
    origin: process.env.FRONT_END_URL,
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger
app.use(logger);

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", authRoutes); // for login/logout check
app.use("/api/oauth", oauthRoutes); // passport Google/GitHub
app.use("/api/users", userRoutes);
app.use("/api/questions", questionRoutes);
app.use('/api/upload', uploadRoutes);
// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));
app.use("/api/answers", answerRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/chat", aiChatRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/stats", statsRoutes);


// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`.green.bold);
});
