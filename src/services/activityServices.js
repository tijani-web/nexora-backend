import { createActivity, ActivityType } from '../models/activityModel.js';

/**
 * Service to handle activity creation with proper messaging
 */
export class ActivityService {
  static async recordQuestionAsked(user_id, question) {
    try {
      // console.log('🎯 Recording question activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.QUESTION_ASKED,
        reference_id: question.id,
        message: `You asked "${question.title}"`,
        metadata: {
          question_title: question.title,
          question_id: question.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record question activity:', error);
      // Don't throw, just log the error
      return null;
    }
  }

  static async recordAnswerPosted(user_id, answer, question) {
    try {
      console.log('🎯 Recording answer activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.ANSWER_POSTED,
        reference_id: answer.id,
        message: `You answered "${question.title}"`,
        metadata: {
          question_title: question.title,
          question_id: question.id,
          answer_id: answer.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record answer activity:', error);
      // Don't throw, just log the error
      return null;
    }
  }

  static async recordAnswerAccepted(user_id, answer, question) {
    try {
      // console.log('🎯 Recording answer accepted activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.ANSWER_ACCEPTED,
        reference_id: answer.id,
        message: `Your answer was accepted on "${question.title}"`,
        metadata: {
          question_title: question.title,
          question_id: question.id,
          answer_id: answer.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record answer accepted activity:', error);
      return null;
    }
  }

  static async recordVoteCast(user_id, vote_type, answer, question) {
    try {
      console.log('🎯 Recording vote activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.VOTE_CAST,
        reference_id: answer.id,
        message: `You ${vote_type}d an answer on "${question.title}"`,
        metadata: {
          vote_type,
          question_title: question.title,
          question_id: question.id,
          answer_id: answer.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record vote activity:', error);
      return null;
    }

  }

  static async recordQuestionAsked(user_id, question) {
    try {
      console.log('🎯 Recording question activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.QUESTION_ASKED,
        reference_id: question.id,
        message: `You asked "${question.title}"`,
        metadata: {
          question_title: question.title,
          question_id: question.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record question activity:', error);
      return null;
    }
  }

  // ✅ ADD: Question edited activity
  static async recordQuestionEdited(user_id, question) {
    try {
      console.log('🎯 Recording question edit activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.QUESTION_EDITED,
        reference_id: question.id,
        message: `You edited "${question.title}"`,
        metadata: {
          question_title: question.title,
          question_id: question.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record question edit activity:', error);
      return null;
    }
  }

  static async recordAnswerPosted(user_id, answer, question) {
    try {
      console.log('🎯 Recording answer activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.ANSWER_POSTED,
        reference_id: answer.id,
        message: `You answered "${question.title}"`,
        metadata: {
          question_title: question.title,
          question_id: question.id,
          answer_id: answer.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record answer activity:', error);
      return null;
    }
  }

  // ✅ ADD: Answer edited activity
  static async recordAnswerEdited(user_id, answer, question) {
    try {
      console.log('🎯 Recording answer edit activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.ANSWER_EDITED,
        reference_id: answer.id,
        message: `You edited your answer on "${question.title}"`,
        metadata: {
          question_title: question.title,
          question_id: question.id,
          answer_id: answer.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record answer edit activity:', error);
      return null;
    }
  }

  static async recordAnswerAccepted(user_id, answer, question) {
    try {
      console.log('🎯 Recording answer accepted activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.ANSWER_ACCEPTED,
        reference_id: answer.id,
        message: `Your answer was accepted on "${question.title}"`,
        metadata: {
          question_title: question.title,
          question_id: question.id,
          answer_id: answer.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record answer accepted activity:', error);
      return null;
    }
  }

  static async recordVoteCast(user_id, vote_type, answer, question) {
    try {
      console.log('🎯 Recording vote activity for user:', user_id);
      return await createActivity({
        user_id,
        type: ActivityType.VOTE_CAST,
        reference_id: answer.id,
        message: `You ${vote_type}d an answer on "${question.title}"`,
        metadata: {
          vote_type,
          question_title: question.title,
          question_id: question.id,
          answer_id: answer.id
        }
      });
    } catch (error) {
      console.error('❌ Failed to record vote activity:', error);
      return null;
    }
  }

}