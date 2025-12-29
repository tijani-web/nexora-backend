import { createNotification, NotificationType } from '../models/notificationModel.js';

export class NotificationService {
  /**
   * Notify question owner when someone answers their question
   */
  static async notifyAnswerPosted(questionOwnerId, answer, question, answerAuthor) {
  // ✅ ADD NULL CHECKS
  if (!questionOwnerId || !answerAuthor) {
    console.error('❌ Cannot create notification: Missing user data');
    return null;
  }
  
  return await createNotification({
    user_id: questionOwnerId,
    type: NotificationType.ANSWER_POSTED,
    title: 'New Answer',
    message: `${answerAuthor.name} answered your question "${question.title}"`,
    reference_id: question.id,
    metadata: {
      answer_id: answer.id,
      answer_preview: answer.body.substring(0, 100) + '...',
      question_title: question.title,
      answer_author: answerAuthor.name
    }
  });
}

  /**
   * Notify answer author when their answer is accepted
   */
  static async notifyAnswerAccepted(answerAuthorId, answer, question, questionOwner) {
    return await createNotification({
      user_id: answerAuthorId,
      type: NotificationType.ANSWER_ACCEPTED,
      title: 'Answer Accepted!',
      message: `Your answer was accepted on "${question.title}"`,
      reference_id: question.id,
      metadata: {
        answer_id: answer.id,
        question_title: question.title,
        question_owner: questionOwner.name
      }
    });
  }

  /**
   * Notify answer author when someone votes on their answer
   */
  static async notifyVoteReceived(answerAuthorId, voteType, answer, question, voter) {
    const action = voteType === 'upvote' ? 'upvoted' : 'downvoted';
    
    return await createNotification({
      user_id: answerAuthorId,
      type: NotificationType.VOTE_RECEIVED,
      title: 'New Vote',
      message: `${voter.name} ${action} your answer on "${question.title}"`,
      reference_id: answer.id,
      metadata: {
        vote_type: voteType,
        question_title: question.title,
        question_id: question.id,
        voter_name: voter.name
      }
    });
  }

  /**
   * Notify user when they're mentioned in question/answer
   */
  static async notifyMention(mentionedUserId, mentioner, content, referenceId, contentType) {
    return await createNotification({
      user_id: mentionedUserId,
      type: NotificationType.MENTION,
      title: 'You were mentioned',
      message: `${mentioner.name} mentioned you in a ${contentType}`,
      reference_id: referenceId,
      metadata: {
        mentioner_name: mentioner.name,
        content_preview: content.substring(0, 100) + '...',
        content_type: contentType // 'question' or 'answer'
      }
    });
  }

  /**
   * System announcement to users
   */
  static async sendSystemAnnouncement(userIds, title, message, metadata = null) {
    const notifications = [];
    for (const userId of userIds) {
      const notification = await createNotification({
        user_id: userId,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: title,
        message: message,
        reference_id: null,
        metadata: metadata
      });
      notifications.push(notification);
    }
    return notifications;
  }
}