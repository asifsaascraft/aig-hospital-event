import express from "express";

import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getActiveQuestions,
  inactivateQuestion,
  inactivateAllQuestions,
} from "../controllers/questionController.js";

const router = express.Router();

// ==========================
// CRUD APIs
// ==========================

// Create Question
router.post("/", createQuestion);

// Get All Questions
router.get("/", getAllQuestions);

// Get Active Questions
router.get("/active", getActiveQuestions);

// Make All Questions Inactive
router.put("/inactive-all", inactivateAllQuestions);

// Make One Question Inactive
router.put("/:id/inactive", inactivateQuestion);

// Get Question By ID
router.get("/:id", getQuestionById);

// Update Question
router.put("/:id", updateQuestion);

// Delete Question
router.delete("/:id", deleteQuestion);

export default router;