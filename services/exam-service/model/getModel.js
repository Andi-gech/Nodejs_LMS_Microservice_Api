const { getTenantModel } = require("../config/tenantModelManager");
const { ExamSchema } = require("./exam.model");
const { ExamSubmissionSchema } = require("./examSubmission.model");
const { QuestionSchema } = require("./question.model");
const { AnswerSchema } = require("./answer.model");
const { ResultSchema } = require("./result.model");
const { AssignmentSchema } = require("./assignment.model");
const { AssignmentSubmissionSchema } = require("./assignmentSubmission.model");

const schemaMap = {
  Exam: ExamSchema,
  ExamSubmission: ExamSubmissionSchema,
  Question: QuestionSchema,
  Answer: AnswerSchema,
  Result: ResultSchema,
  Assignment: AssignmentSchema,
  AssignmentSubmission: AssignmentSubmissionSchema,
};

function getModel(tenantId, modelName) {
  const schema = schemaMap[modelName];
  if (!schema) throw new Error(`Schema for model '${modelName}' not found.`);
  return getTenantModel(tenantId, modelName, schema);
}

module.exports = { getModel };
